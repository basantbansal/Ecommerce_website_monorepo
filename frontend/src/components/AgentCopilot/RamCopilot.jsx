import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { FiShoppingBag } from 'react-icons/fi';
import { api, chatWithAgentApi } from '../../api';
import { useUser } from '../../context/user.js';
import './RamCopilot.css';
import { usePurchased } from '../../context/Purchased';


const AgentProductCard = ({ p, handleBuyIndividual, askForCombo, isLoading }) => {
  const [qty, setQty] = useState(1);
  return (
    <div className="agent-product-card" onClick={(e) => { e.stopPropagation(); askForCombo(p); }}>
      <img src={p.image || "https://via.placeholder.com/150"} alt={p.title} className="agent-product-image" />
      <div className="agent-product-info">
        <div className="agent-product-title">{p.title}</div>
        <div className="agent-product-price">Rs. {p.price}</div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
          <button style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid #ccc' }} onClick={(e) => { e.stopPropagation(); setQty(Math.max(1, qty - 1)) }}>-</button>
          <span>{qty}</span>
          <button style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid #ccc' }} onClick={(e) => { e.stopPropagation(); setQty(qty + 1) }}>+</button>
        </div>

        <div className="product-card-actions">
          <button className="agent-buy-btn" disabled={isLoading} onClick={(e) => { e.stopPropagation(); handleBuyIndividual(p, qty); }}>Buy Now</button>
          <button className="add-to-bundle-btn" disabled={isLoading} onClick={(e) => { e.stopPropagation(); askForCombo(p); }}>Find Combos</button>
        </div>
      </div>
    </div>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("RamCopilot Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <div className="ram-copilot-container"><button className="ram-copilot-trigger" style={{background:'red'}}>⚠️</button></div>;
    }
    return this.props.children;
  }
}

const generateSessionId = () => {
  let id = localStorage.getItem('ram_session_id');
  if (!id) {
    id = 'ram_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('ram_session_id', id);
  }
  return id;
};

const formatPrice = (price) => {
  if (!price) return '0.00';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(price);
};

const FallbackImage = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="%239ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';

const RamCopilotInner = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // SECURITY: Only allow opening if user is authenticated
  const isOpen = user && searchParams.get('ram') === 'open';

  const setIsOpen = (open) => {
    if (open) {
      if (!user) {
        navigate('/login');
        return;
      }
      searchParams.set('ram', 'open');
      setSearchParams(searchParams);
    } else {
      searchParams.delete('ram');
      setSearchParams(searchParams);
    }
  };

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('ram_messages');
    return saved ? JSON.parse(saved) : [
      { role: 'ai', content: "Hi! I'm RAM, your Agentic Commerce Assistant. How can I help you today? I can find products, offer bundle discounts up to 15%, and help you checkout." }
    ];
  });

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const purchasedContext = usePurchased();
  const loadPurchases = purchasedContext ? purchasedContext.loadPurchases : null;
  const [sessionId] = useState(generateSessionId());

  // NEW: Bundle builder state
  const [bundleItems, setBundleItems] = useState([]);
  const [showBundleBuilder, setShowBundleBuilder] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const chatEndRef = useRef(null);

  const showNotification = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  useEffect(() => {
    localStorage.setItem('ram_messages', JSON.stringify(messages));
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen]);

  const handleSend = async (overrideMessage = null) => {
    const textToSend = overrideMessage || inputValue;
    if (!textToSend.trim()) return;

    setMessages(prev => [...prev, { role: 'human', content: textToSend }]);
    if (!overrideMessage) setInputValue('');
    setIsLoading(true);

    try {
      const res = await chatWithAgentApi(textToSend, sessionId);
      const { response, orderId } = res.data.data;

      let cleanResponse = response;
      let suggestedProducts = [];
      
      const productRegex = /<products>([\s\S]*?)<\/products>/;
      const match = cleanResponse.match(productRegex);
      
      if (match) {
        let jsonStr = match[1];
        jsonStr = jsonStr.replace(/```(json|xml|html)?/gi, '').trim();
        
        try {
          suggestedProducts = JSON.parse(jsonStr);
        } catch (e) {
          console.error("Failed to parse agent products JSON", e);
        }
        
        cleanResponse = cleanResponse.replace(productRegex, '').trim();
        cleanResponse = cleanResponse.replace(/```/g, '').trim();
      }

      setMessages(prev => [...prev, {
        role: 'ai',
        content: cleanResponse,
        orderId,
        products: suggestedProducts
      }]);
    } catch (error) {
      console.error(error);
      let errorMsg = "Sorry, I encountered an error. Please try again.";
      if (error.response?.status === 429 || error.message?.includes('429')) {
        errorMsg = "⚠️ I'm currently rate-limited by the AI provider. Please wait 30-40 seconds and try again!";
      }
      setMessages(prev => [...prev, { role: 'ai', content: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckout = (orderId) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'dummy', 
      order_id: orderId,
      name: "Buy-It Store",
      description: "Agentic Checkout",
      handler: async function (response) {
        try {
          await api.post(`/api/v1/payments/agent/razorpay-verify`, response);
          if (loadPurchases) await loadPurchases(); // <--- Refresh global purchase state
          setMessages(prev => [...prev, { role: 'ai', content: `🎉 Payment successful! Payment ID: **${response.razorpay_payment_id}**. What else would you like to buy today?` }]);
        } catch (error) {
          console.error("Verification failed", error);
          setMessages(prev => [...prev, { role: 'ai', content: `❌ Payment verification failed.` }]);
        }
      },
      theme: {
        color: "#6366f1"
      }
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const handleBuySingleProduct = (product) => {
    handleSend(`I want to buy ${qty}x ${product.title} (ID: ${product.id || product._id}). Please create a Razorpay order.`);
  };

  const handleProductClick = (e, product) => {
    if (e.target.tagName.toLowerCase() === 'button') return;
    const productId = product.id || product._id;
    if (productId) {
      navigate(`/product/${productId}`);
    }
  };

  // NEW: Bundle builder functions
  const addToBundle = (product) => {
    const productId = product.id || product._id;
    if (!bundleItems.find(item => (item.id || item._id) === productId)) {
      setBundleItems([...bundleItems, product]);
      setShowBundleBuilder(true);
    }
  };

  const removeFromBundle = (productId) => {
    setBundleItems(bundleItems.filter(item => (item.id || item._id) !== productId));
    if (bundleItems.length <= 1) {
      setShowBundleBuilder(false);
    }
  };

  const calculateBundleDiscount = (items) => {
    const count = items.length;
    if (count < 2) return 0;
    if (count === 2) return 5;
    if (count === 3) return 10;
    return 15;
  };

  const getBundleTotal = () => {
    const subtotal = bundleItems.reduce((sum, item) => sum + (item.price || 0), 0);
    const discount = calculateBundleDiscount(bundleItems);
    const discountAmount = (subtotal * discount) / 100;
    return {
      subtotal,
      discount,
      discountAmount,
      total: subtotal - discountAmount
    };
  };

  const handleBuyBundle = () => {
    const productIds = bundleItems.map(p => p.id || p._id).join(', ');
    const bundleText = bundleItems.map(p => p.title).join(' + ');
    handleSend(`I want to buy this bundle: ${bundleText}. Product IDs: ${productIds}. Please create a Razorpay order.`);
    setBundleItems([]);
    setShowBundleBuilder(false);
  };

  const handleBuyIndividual = (product, qty = 1) => {
    handleSend(`I want to buy 1x ${product.title} (ID: ${product.id || product._id}). Please create a Razorpay order.`);
  };

  const askForCombo = (product) => {
    handleSend(`I'm interested in ${product.title}. Can you suggest compatible products for a bundle discount?`);
  };

  const clearBundle = () => {
    setBundleItems([]);
    setShowBundleBuilder(false);
  };

  if (!isOpen) {
    return (
      <div className="ram-copilot-container">
        <button 
          className="ram-copilot-trigger" 
          onClick={() => {
            if (!user) {
              navigate('/login');
            } else {
              setIsOpen(true);
            }
          }}
        >
          <FiShoppingBag size={24} />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="ram-copilot-backdrop" onClick={() => setIsOpen(false)}>
        <div className="ram-copilot-window" onClick={(e) => e.stopPropagation()}>
          
          <div className="ram-header">
            <h3><FiShoppingBag size={20} style={{display: 'inline', marginRight: '8px'}} /> RAM Agent</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => {
                  if (window.confirm('Clear chat history?')) {
                    localStorage.removeItem('ram_messages');
                    localStorage.removeItem('ram_session_id');
                    window.location.reload();
                  }
                }}
                style={{
                  background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', 
                  padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem'
                }}
              >
                Reset
              </button>
              <button className="ram-close-btn" onClick={() => setIsOpen(false)}>×</button>
            </div>
          </div>
          
          <div className="ram-main-content">
            <div className="ram-chat-area">
              {messages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.role}`}>
                  <div className="markdown-body">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  
                  {messages.length === 1 && idx === 0 && (
                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <p style={{ fontSize: '0.85rem', color: '#666', margin: 0, fontWeight: 500 }}>Try asking:</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {[
                          "I need a phone",
                          "I want to buy the Apple Airpods, do you have any combos for it?",
                          "Show me some shirts under 2500",
                          "I'm looking for a gaming laptop bundle"
                        ].map((prompt, i) => (
                          <button
                            key={i}
                            onClick={() => handleSend(prompt)}
                            style={{
                              background: '#f0f4ff', color: '#4361ee', border: '1px solid #d0dfff',
                              padding: '6px 10px', borderRadius: '16px', fontSize: '0.8rem', cursor: 'pointer',
                              textAlign: 'left', transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.background = '#e0e7ff'}
                            onMouseOut={(e) => e.target.style.background = '#f0f4ff'}
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {msg.products && msg.products.length > 0 && (
                    <div className="agent-products-grid">
                      {msg.products.map((p, i) => (
                        <AgentProductCard key={i} p={p} handleBuyIndividual={handleBuyIndividual} askForCombo={askForCombo} isLoading={isLoading} />
                      ))}
                    </div>
                  )}

                  {msg.orderId && (
                    <div className="bundle-checkout-card">
                      <strong>✨ Your Order is Ready ✨</strong>
                      <p style={{ margin: '8px 0', fontSize: '0.9rem' }}>Click below to securely complete your payment.</p>
                      <button className="buy-now-btn" onClick={() => handleCheckout(msg.orderId)}>
                        Pay via Razorpay
                      </button>
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="message ai typing-indicator">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              )}

              {/* NEW: Interactive Bundle Builder */}
              {showBundleBuilder && bundleItems.length > 0 && (
                <div className="interactive-builder">
                  <div className="builder-header">
                    <div className="builder-title">
                      🎁 Your Bundle ({bundleItems.length} items)
                    </div>
                    <button
                      onClick={clearBundle}
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="selected-items-grid">
                    {bundleItems.map((item, idx) => (
                      <div key={idx} className="selected-item-card">
                        <button
                          className="selected-item-remove"
                          onClick={() => removeFromBundle(item.id || item._id)}
                        >
                          ×
                        </button>
                        <img
                          src={item.image || FallbackImage}
                          alt={item.title}
                          className="selected-item-img"
                          onError={(e) => { e.target.onerror = null; e.target.src = FallbackImage; }}
                        />
                        <div className="selected-item-name">{item.title}</div>
                        <div className="selected-item-price">{formatPrice(item.price)}</div>
                      </div>
                    ))}
                  </div>

                  {bundleItems.length >= 2 && (
                    <>
                      <div className="builder-live-pricing">
                        <div className="builder-price-row">
                          <span>Subtotal ({bundleItems.length} items):</span>
                          <span>{formatPrice(getBundleTotal().subtotal)}</span>
                        </div>
                        <div className="builder-price-row" style={{ color: '#fbbf24' }}>
                          <span>Bundle Discount ({getBundleTotal().discount}%):</span>
                          <span>-{formatPrice(getBundleTotal().discountAmount)}</span>
                        </div>
                        <div className="builder-price-row total">
                          <span>Total:</span>
                          <span>{formatPrice(getBundleTotal().total)}</span>
                        </div>
                      </div>

                      {getBundleTotal().discountAmount > 0 && (
                        <div className="bundle-savings-badge">
                          🎉 You save {formatPrice(getBundleTotal().discountAmount)}!
                        </div>
                      )}

                      <div className="builder-actions">
                        <button
                          className="builder-btn builder-btn-primary"
                          onClick={handleBuyBundle}
                          disabled={isLoading}
                        >
                          🛒 Checkout Bundle
                        </button>
                        <button
                          className="builder-btn builder-btn-secondary"
                          onClick={() => setShowBundleBuilder(false)}
                        >
                          Continue Shopping
                        </button>
                      </div>
                    </>
                  )}

                  {bundleItems.length === 1 && (
                    <div style={{ textAlign: 'center', padding: '16px', color: '#6b7280' }}>
                      Add at least one more item to unlock bundle discounts! 🎁
                    </div>
                  )}
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          </div>

          <div className="ram-input-area">
            <input 
              value={inputValue} 
              onChange={(e) => setInputValue(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask RAM to find or bundle something... (Press Esc to close)" 
              disabled={isLoading}
              autoFocus
            />
            <button onClick={() => handleSend()} disabled={isLoading}>
              ➤
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default function RamCopilot() {
  return (
    <ErrorBoundary>
      <RamCopilotInner />
    </ErrorBoundary>
  );
}
