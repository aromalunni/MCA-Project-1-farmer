// frontend/src/components/FarmerChatbot.jsx
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const FAQ_DATA = {
    en: [
        { q: 'How to file a claim?', a: 'Go to "Upload" page → Select land area → Upload crop damage photo → AI will analyze and calculate your claim amount → Submit the claim.' },
        { q: 'What documents are needed?', a: 'You need: 1) A clear photo of damaged crop 2) Your registered land details. Documents upload is optional during registration.' },
        { q: 'How long does claim processing take?', a: 'Estimated 7-10 working days. Your claim goes through: Requested → Verified (by officer) → Approved (by admin) → Paid.' },
        { q: 'What is the insurance rate?', a: 'Current rate is ₹50,000 per Acre and ₹500 per Cent. Claim Amount = (Area × Rate) × (Damage% / 100).' },
        { q: 'What damage types are covered?', a: 'Flood, Drought, Pest Attack, and Storm damage are covered under PMFBY crop insurance scheme.' },
        { q: 'How to check claim status?', a: 'Go to "Claims" page to see all your claims with current status. Click any claim to view the receipt.' },
        { q: 'How to register new land?', a: 'Go to "Land Records" → Click "Add Land" → Enter details → Search your place name or use GPS to set location → Register.' },
        { q: 'What is minimum damage for claim?', a: 'Any damage percentage (5%, 20%, 40%, 65%) detected by AI is eligible. The claim amount is calculated automatically.' },
        { q: 'How to download receipt?', a: 'Go to "Claims" → Click on any claim → Click "Print" or "PDF" button to download your claim receipt.' },
        { q: 'Contact helpline', a: 'Kisan Call Center: 1800-180-1551 (24/7 Toll Free)\nPMFBY Helpline: 1800-200-7710\nKerala Agriculture: 0471-2304481\nDisaster: 1077' },
    ],
    ml: [
        { q: 'ക്ലെയിം എങ്ങനെ ഫയൽ ചെയ്യും?', a: '"Upload" പേജിൽ പോകുക → ഭൂമി വിസ്തീർണ്ണം തിരഞ്ഞെടുക്കുക → വിള നാശം ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക → AI വിശകലനം ചെയ്യും → ക്ലെയിം സമർപ്പിക്കുക.' },
        { q: 'എന്ത് രേഖകൾ വേണം?', a: 'നിങ്ങൾക്ക് വേണ്ടത്: 1) നശിച്ച വിളയുടെ വ്യക്തമായ ഫോട്ടോ 2) രജിസ്റ്റർ ചെയ്ത ഭൂമി വിവരങ്ങൾ. രജിസ്ട്രേഷൻ സമയത്ത് ഡോക്യുമെന്റ് അപ്‌ലോഡ് ഓപ്ഷണൽ ആണ്.' },
        { q: 'ക്ലെയിം പ്രോസസ്സിംഗ് എത്ര സമയം?', a: '7-10 പ്രവൃത്തി ദിവസങ്ങൾ. നിങ്ങളുടെ ക്ലെയിം: അഭ്യർത്ഥിച്ചു → പരിശോധിച്ചു → അംഗീകരിച്ചു → പേയ്മെന്റ്.' },
        { q: 'ഇൻഷുറൻസ് നിരക്ക് എന്താണ്?', a: 'നിലവിലെ നിരക്ക് ഏക്കറിന് ₹50,000, സെന്റിന് ₹500. ക്ലെയിം തുക = (വിസ്തീർണ്ണം × നിരക്ക്) × (നാശം% / 100).' },
        { q: 'ഏത് നാശനഷ്ടങ്ങൾ?', a: 'വെള്ളപ്പൊക്കം, വരൾച്ച, കീടബാധ, കൊടുങ്കാറ്റ് എന്നിവ PMFBY വിള ഇൻഷുറൻസ് പദ്ധതിയിൽ ഉൾപ്പെടുന്നു.' },
        { q: 'ക്ലെയിം സ്റ്റാറ്റസ് എങ്ങനെ?', a: '"Claims" പേജിൽ പോകുക. നിങ്ങളുടെ എല്ലാ ക്ലെയിമുകളും സ്റ്റാറ്റസ് കാണാം. ക്ലിക്ക് ചെയ്താൽ രസീത് കാണാം.' },
        { q: 'പുതിയ ഭൂമി രജിസ്റ്റർ?', a: '"Land Records" → "Add Land" → വിവരങ്ങൾ നൽകുക → സ്ഥലപ്പേര് സെർച്ച് ചെയ്യുക അല്ലെങ്കിൽ GPS ഉപയോഗിക്കുക → രജിസ്റ്റർ.' },
        { q: 'ഹെൽപ്‌ലൈൻ നമ്പർ', a: 'കിസാൻ കോൾ സെന്റർ: 1800-180-1551 (24/7 സൗജന്യം)\nPMFBY ഹെൽപ്‌ലൈൻ: 1800-200-7710\nകേരള കൃഷി: 0471-2304481\nദുരന്തം: 1077' },
    ]
};

export default function FarmerChatbot() {
    const { language } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [showFaq, setShowFaq] = useState(true);
    const chatEndRef = useRef(null);

    const faqs = FAQ_DATA[language] || FAQ_DATA.en;

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{
                from: 'bot',
                text: language === 'ml'
                    ? 'നമസ്കാരം! ഞാൻ PMFBY സഹായി. വിള ഇൻഷുറൻസ് സംബന്ധിച്ച സഹായത്തിന് ചുവടെയുള്ള ചോദ്യങ്ങൾ തിരഞ്ഞെടുക്കുക.'
                    : 'Hello! I\'m your PMFBY Crop Insurance Assistant. Select a question below or type your query.'
            }]);
        }
    }, [isOpen]);

    const handleFaqClick = (faq) => {
        setMessages(prev => [
            ...prev,
            { from: 'user', text: faq.q },
            { from: 'bot', text: faq.a }
        ]);
        setShowFaq(false);
    };

    const handleSend = () => {
        if (!input.trim()) return;
        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { from: 'user', text: userMsg }]);

        // Simple keyword matching
        const lower = userMsg.toLowerCase();
        let reply = '';

        const allFaqs = [...FAQ_DATA.en, ...FAQ_DATA.ml];
        const match = allFaqs.find(f =>
            f.q.toLowerCase().includes(lower) ||
            lower.includes(f.q.toLowerCase().split(' ').slice(0, 2).join(' '))
        );

        if (match) {
            reply = match.a;
        } else if (lower.includes('claim') || lower.includes('ക്ലെയിം')) {
            reply = language === 'ml' ? 'ക്ലെയിം ഫയൽ ചെയ്യാൻ Upload പേജിൽ പോകുക. ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക, AI വിശകലനം ചെയ്യും.' : 'To file a claim, go to Upload page, upload a crop damage photo, and AI will analyze it automatically.';
        } else if (lower.includes('rate') || lower.includes('price') || lower.includes('നിരക്ക്')) {
            reply = language === 'ml' ? 'നിലവിലെ നിരക്ക്: ₹50,000/ഏക്കർ, ₹500/സെന്റ്.' : 'Current rate: ₹50,000/Acre, ₹500/Cent.';
        } else if (lower.includes('help') || lower.includes('സഹായം') || lower.includes('phone') || lower.includes('call')) {
            reply = 'Kisan Call Center: 1800-180-1551 (24/7)\nPMFBY: 1800-200-7710\nDisaster: 1077';
        } else if (lower.includes('status') || lower.includes('track') || lower.includes('സ്റ്റാറ്റസ്')) {
            reply = language === 'ml' ? 'Claims പേജിൽ നിങ്ങളുടെ ക്ലെയിം സ്റ്റാറ്റസ് കാണാം.' : 'Check your claim status on the Claims page.';
        } else {
            reply = language === 'ml'
                ? 'ക്ഷമിക്കണം, ഇതിന് ഉത്തരം എനിക്ക് ലഭ്യമല്ല. ദയവായി ചുവടെയുള്ള ചോദ്യങ്ങൾ നോക്കുക അല്ലെങ്കിൽ 1800-180-1551 വിളിക്കുക.'
                : 'Sorry, I couldn\'t find an answer. Please try the questions below or call helpline 1800-180-1551.';
            setTimeout(() => setShowFaq(true), 100);
        }

        setTimeout(() => {
            setMessages(prev => [...prev, { from: 'bot', text: reply }]);
        }, 500);
    };

    return (
        <>
            {/* Floating Chat Button */}
            {!isOpen && (
                <button onClick={() => setIsOpen(true)} style={{
                    position: 'fixed', bottom: '24px', right: '24px', zIndex: 9998,
                    width: '60px', height: '60px', borderRadius: '50%',
                    background: 'var(--paddy-green)', color: 'white', border: 'none',
                    cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,132,61,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'fadeInUp 0.3s ease'
                }}>
                    <MessageCircle size={28} />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div style={{
                    position: 'fixed', bottom: '24px', right: '24px', zIndex: 9998,
                    width: '370px', maxWidth: 'calc(100vw - 32px)', height: '520px', maxHeight: 'calc(100vh - 100px)',
                    background: 'white', borderRadius: '20px',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    animation: 'fadeInUp 0.3s ease'
                }}>
                    {/* Header */}
                    <div style={{
                        background: 'var(--paddy-green)', color: 'white', padding: '14px 16px',
                        display: 'flex', alignItems: 'center', gap: '10px'
                    }}>
                        <Bot size={24} />
                        <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>
                                {language === 'ml' ? 'PMFBY സഹായി' : 'PMFBY Assistant'}
                            </p>
                            <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.8 }}>
                                {language === 'ml' ? 'വിള ഇൻഷുറൻസ് സഹായം' : 'Crop Insurance Help'}
                            </p>
                        </div>
                        <button onClick={() => setIsOpen(false)} style={{
                            background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
                            cursor: 'pointer', borderRadius: '8px', padding: '4px', display: 'flex'
                        }}><X size={18} /></button>
                    </div>

                    {/* Messages */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {messages.map((msg, i) => (
                            <div key={i} style={{
                                display: 'flex', justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start'
                            }}>
                                <div style={{
                                    maxWidth: '85%', padding: '10px 14px', borderRadius: '14px',
                                    background: msg.from === 'user' ? 'var(--paddy-green)' : '#F1F1F1',
                                    color: msg.from === 'user' ? 'white' : '#333',
                                    fontSize: '0.85rem', lineHeight: 1.5, whiteSpace: 'pre-line'
                                }}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}

                        {/* FAQ Suggestions */}
                        {showFaq && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                                {faqs.slice(0, 6).map((faq, i) => (
                                    <button key={i} onClick={() => handleFaqClick(faq)} style={{
                                        background: '#E8F5E9', border: '1px solid #C8E6C9',
                                        borderRadius: '20px', padding: '6px 12px',
                                        fontSize: '0.75rem', cursor: 'pointer', color: '#2E7D32',
                                        fontWeight: 500, transition: 'all 0.2s'
                                    }}>
                                        {faq.q}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input */}
                    <div style={{
                        padding: '10px 12px', borderTop: '1px solid #eee',
                        display: 'flex', gap: '8px', alignItems: 'center'
                    }}>
                        <button onClick={() => setShowFaq(!showFaq)} style={{
                            background: '#F5F5F5', border: 'none', borderRadius: '8px',
                            padding: '8px', cursor: 'pointer', display: 'flex', fontSize: '0.9rem'
                        }}>?</button>
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            placeholder={language === 'ml' ? 'ചോദ്യം ടൈപ്പ് ചെയ്യുക...' : 'Type your question...'}
                            style={{
                                flex: 1, border: '1.5px solid #e0e0e0', borderRadius: '10px',
                                padding: '8px 12px', fontSize: '0.85rem', outline: 'none'
                            }}
                        />
                        <button onClick={handleSend} style={{
                            background: 'var(--paddy-green)', color: 'white', border: 'none',
                            borderRadius: '10px', padding: '8px 12px', cursor: 'pointer', display: 'flex'
                        }}>
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
