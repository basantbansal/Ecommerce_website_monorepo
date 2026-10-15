import {Router} from "express"
import {upload} from "../middlewares/multer.middleware.js"
import {
    storeProducts,
    getProducts,
    getProductById,
    importDummyProducts,
    updateProductStock,
    deleteProduct,
    getAgentCatalog
} from "../controllers/product.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()

router.route("/").get(getProducts)
router.route("/agent-catalog").get(getAgentCatalog)

router.route("/store-products").post(
    verifyJWT,
    upload.fields([
        {
            name: "image",
            maxCount: 1
        }
    ]),
    storeProducts
    )

router.route("/import-dummy-products").post(verifyJWT, importDummyProducts)

router.route("/:productId").get(getProductById).delete(verifyJWT, deleteProduct)
router.route("/:productId/stock").patch(verifyJWT, updateProductStock)

export default router
