import test, { describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { User } from "../models/user.models.js";
import { forgotPassword, resetPassword } from "../controllers/user.controller.js";
import { sendEmail, setResendClient } from "../utils/email.js";
import { app } from "../app.js";

describe("Password Reset & Email Delivery Suite", () => {
    let originalEnv;
    let originalFindOne;

    beforeEach(() => {
        originalEnv = { ...process.env };
        process.env.RESEND_API_KEY = "re_mock_test_key";
        process.env.EMAIL_FROM = "Amazing Store <onboarding@resend.dev>";
        process.env.FRONTEND_URL = "http://localhost:3000";
        process.env.NODE_ENV = "test";

        originalFindOne = User.findOne;
        setResendClient(null);
    });

    afterEach(() => {
        process.env = originalEnv;
        User.findOne = originalFindOne;
        setResendClient(null);
    });

    const createMockRes = () => {
        return {
            statusCode: 200,
            body: null,
            status(code) {
                this.statusCode = code;
                return this;
            },
            json(data) {
                this.body = data;
                return this;
            }
        };
    };

    // Helper to invoke asyncHandler wrapped controller in a Promise
    const invokeController = (controller, req, res) => {
        return new Promise((resolve, reject) => {
            const next = (err) => {
                if (err) return reject(err);
                resolve(res);
            };

            const origJson = res.json.bind(res);
            res.json = (data) => {
                origJson(data);
                resolve(res);
                return res;
            };

            controller(req, res, next);
        });
    };

    test("1. Successful sending: generates token, calls sendEmail via Resend, and returns 200 generic response", async () => {
        let tokenGenerated = false;
        let userSaved = false;
        let resendPayload = null;

        const mockUser = {
            _id: "user123",
            email: "verified@example.com",
            emailVerified: true,
            createPasswordResetToken() {
                tokenGenerated = true;
                return "mock-reset-token-xyz";
            },
            save: async () => {
                userSaved = true;
                return true;
            }
        };

        User.findOne = async () => mockUser;

        // Mock Resend SDK client to simulate successful delivery
        setResendClient({
            emails: {
                send: async (payload) => {
                    resendPayload = payload;
                    return { data: { id: "msg_mock_success_123" }, error: null };
                }
            }
        });

        const req = { body: { email: "verified@example.com" } };
        const res = createMockRes();

        await invokeController(forgotPassword, req, res);

        assert.strictEqual(res.statusCode, 200, "Should return HTTP 200");
        assert.match(
            res.body.message,
            /If an account exists for that email, a password-reset link has been sent/i,
            "Should return standard enumeration-safe generic message"
        );
        assert.strictEqual(tokenGenerated, true, "createPasswordResetToken must be called");
        assert.strictEqual(userSaved, true, "user.save() must be called");
        assert.ok(resendPayload, "Resend send() must be called");
        assert.deepStrictEqual(resendPayload.to, ["verified@example.com"]);
        assert.match(resendPayload.html, /reset-password\?token=mock-reset-token-xyz/);
    });

    test("2. Resend rejection: fails safely with 503 error when Resend rejects the email", async () => {
        const mockUser = {
            _id: "user123",
            email: "rejected@example.com",
            emailVerified: true,
            createPasswordResetToken() {
                return "mock-token";
            },
            save: async () => true
        };

        User.findOne = async () => mockUser;

        // Mock Resend SDK returning an error response (e.g. sandbox restriction or unverified domain)
        setResendClient({
            emails: {
                send: async () => ({
                    data: null,
                    error: {
                        name: "validation_error",
                        message: "You can only send testing emails to your own email address."
                    }
                })
            }
        });

        const req = { body: { email: "rejected@example.com" } };
        const res = createMockRes();

        await assert.rejects(
            async () => {
                await invokeController(forgotPassword, req, res);
            },
            (err) => {
                assert.strictEqual(err.statusCode, 503, "Must return HTTP 503 on provider rejection");
                assert.match(err.message, /Failed to send password-reset email/i);
                return true;
            }
        );
    });

    test("3. Missing configuration: returns 500 when RESEND_API_KEY is not defined", async () => {
        delete process.env.RESEND_API_KEY;

        const mockUser = {
            _id: "user123",
            email: "user@example.com",
            emailVerified: true,
            createPasswordResetToken() {
                return "mock-token";
            },
            save: async () => true
        };

        User.findOne = async () => mockUser;

        const req = { body: { email: "user@example.com" } };
        const res = createMockRes();

        await assert.rejects(
            async () => {
                await invokeController(forgotPassword, req, res);
            },
            (err) => {
                assert.strictEqual(err.statusCode, 500, "Must return HTTP 500 when RESEND_API_KEY is missing");
                assert.match(err.message, /Email service is not configured/i);
                return true;
            }
        );
    });

    test("4. Unknown account: returns HTTP 200 generic response without calling Resend to prevent enumeration", async () => {
        User.findOne = async () => null;

        let resendCalled = false;
        setResendClient({
            emails: {
                send: async () => {
                    resendCalled = true;
                    return { data: { id: "never_called" }, error: null };
                }
            }
        });

        const req = { body: { email: "nonexistent@example.com" } };
        const res = createMockRes();

        await invokeController(forgotPassword, req, res);

        assert.strictEqual(res.statusCode, 200, "Must return HTTP 200 for unknown accounts");
        assert.match(
            res.body.message,
            /If an account exists for that email, a password-reset link has been sent/i,
            "Must return the exact same generic message to prevent enumeration"
        );
        assert.strictEqual(resendCalled, false, "Resend must NOT be called for non-existent accounts");
    });

    test("5. Unexpected error: handles database or unexpected runtime errors cleanly with HTTP 503", async () => {
        const mockUser = {
            _id: "user123",
            email: "dbfail@example.com",
            emailVerified: true,
            createPasswordResetToken() {
                return "mock-token";
            },
            save: async () => {
                throw new Error("Mongo network error: connection closed");
            }
        };

        User.findOne = async () => mockUser;

        const req = { body: { email: "dbfail@example.com" } };
        const res = createMockRes();

        await assert.rejects(
            async () => {
                await invokeController(forgotPassword, req, res);
            },
            (err) => {
                assert.strictEqual(err.statusCode, 503, "Must return HTTP 503 on database save failure");
                assert.match(err.message, /Failed to send password-reset email/i);
                return true;
            }
        );
    });

    test("6. Email utility (sendEmail): returns data on success and throws descriptive error on SDK error", async () => {
        // Success case
        setResendClient({
            emails: {
                send: async () => ({ data: { id: "email_ok_123" }, error: null })
            }
        });

        const data = await sendEmail({
            to: "target@example.com",
            subject: "Test Subject",
            html: "<p>Hello</p>",
            text: "Hello"
        });
        assert.strictEqual(data.id, "email_ok_123");

        // Failure case
        setResendClient({
            emails: {
                send: async () => ({
                    data: null,
                    error: { name: "invalid_api_key", message: "API key is invalid" }
                })
            }
        });

        await assert.rejects(
            async () => {
                await sendEmail({
                    to: "target@example.com",
                    subject: "Test Subject",
                    html: "<p>Hello</p>",
                    text: "Hello"
                });
            },
            (err) => {
                assert.match(err.message, /API key is invalid/);
                return true;
            }
        );
    });

    test("7. Proxy configuration: Express app has trust proxy enabled for Render (trust proxy = 1)", () => {
        const trustProxySetting = app.get("trust proxy");
        assert.strictEqual(trustProxySetting, 1, "trust proxy setting must be 1 for single-hop reverse proxy");
    });
});
