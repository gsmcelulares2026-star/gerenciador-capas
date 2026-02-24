import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 4000 }) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 300);
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const icons = {
        success: <CheckCircle size={18} />,
        error: <AlertCircle size={18} />,
        info: <Info size={18} />,
    };

    if (!visible) return null;

    return (
        <div className={`toast ${type}`}>
            {icons[type]}
            <span>{message}</span>
            <X size={16} style={{ cursor: 'pointer', marginLeft: 8, opacity: 0.7 }} onClick={() => { setVisible(false); onClose(); }} />
        </div>
    );
}
