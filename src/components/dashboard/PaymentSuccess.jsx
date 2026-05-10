import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowLeft, Download, CreditCard } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const reference = searchParams.get('reference');
  const receiptRef = useRef(null);

  useEffect(() => {
    if (reference) {
      const fetchPaymentDetails = async () => {
        try {
          // Fetch transaction
          const { data: transaction, error: txError } = await supabase
            .from('payment_transactions')
            .select('*')
            .eq('reference', reference)
            .maybeSingle();

          if (txError) throw txError;

          let profileData = null;
          if (transaction?.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', transaction.user_id)
              .maybeSingle();
            profileData = profile;
          }

          if (transaction) {
            setPaymentStatus({
              status: transaction.status || 'completed',
              amount: transaction.amount,
              currency: transaction.currency || 'NGN',
              plan: transaction.plan_id,
              date: transaction.completed_at || transaction.created_at,
              customerName: profileData?.full_name,
              customerEmail: profileData?.email,
              method: transaction.gateway || 'Paystack'
            });
          } else {
            // Fallback for optimistic UI if record hasn't hit DB yet
            setPaymentStatus({
              status: 'completed',
              amount: searchParams.get('amount') || '0',
              plan: 'Pro Plan',
              date: new Date().toISOString()
            });
          }
        } catch (e) {
          console.error('Error fetching details:', e);
          // Fallback on error
          setPaymentStatus({
            status: 'completed',
            amount: searchParams.get('amount') || '0',
            plan: 'Pro Plan',
            date: new Date().toISOString()
          });
        } finally {
          setLoading(false);
        }
      };
      fetchPaymentDetails();
    }
  }, [reference]);

  const handleDownloadReceipt = async () => {
    if (!receiptRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Luter_Receipt_${reference}.pdf`);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleGoHome = () => navigate('/dashboard');

  if (loading && !paymentStatus) {
    return (
      <div style={containerStyles}>
        <div style={spinnerContainerStyles}>
          <div style={spinnerStyles} />
          <div style={{ fontSize: 16, color: '#64748b' }}>Generating your receipt...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageWrapperStyles}>
      {/* Header */}
      <div style={headerStyles}>
        <div style={headerInnerStyles}>
          <button onClick={handleGoHome} style={backBtnStyles}>
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>
          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              onClick={handleDownloadReceipt} 
              disabled={isDownloading}
              style={actionBtnStyles}
            >
              {isDownloading ? 'Processing...' : (
                <><Download size={18} /> Download Receipt</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Receipt Content */}
      <div style={contentAreaStyles}>
        <div ref={receiptRef} style={receiptCardStyles}>
          {/* Ticket Header Decor */}
          <div style={ticketHoleLeft} />
          <div style={ticketHoleRight} />
          
          <div style={receiptHeader}>
            <div style={logoContainer}>
              <span style={logoText}>luter<span style={{color: '#7a12cc'}}>.</span></span>
            </div>
            <div style={successIconContainer}>
              <CheckCircle2 size={48} color="#10b981" />
            </div>
            <h1 style={receiptTitle}>Payment Successful</h1>
            <p style={receiptSubtitle}>Thank you! Your upgrade is now active.</p>
          </div>

          <div style={dividerDashed} />

          <div style={receiptBody}>
            <div style={infoGrid}>
              <div style={infoItem}>
                <span style={infoLabel}>REFERENCE</span>
                <span style={infoValue}>{reference}</span>
              </div>
              <div style={infoItem}>
                <span style={infoLabel}>DATE & TIME</span>
                <span style={infoValue}>
                  {paymentStatus?.date ? new Date(paymentStatus.date).toLocaleString('en-GB', {
                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  }) : '---'}
                </span>
              </div>
            </div>

            <div style={paymentSummaryBox}>
              <div style={summaryRow}>
                <span style={summaryLabel}>Package</span>
                <span style={summaryValue}>{paymentStatus?.plan || 'Pro Plan'}</span>
              </div>
              <div style={summaryRow}>
                <span style={summaryLabel}>Payment Method</span>
                <span style={{...summaryValue, display: 'flex', alignItems: 'center', gap: 6}}>
                  <CreditCard size={14} /> {paymentStatus?.method || 'Card'}
                </span>
              </div>
              <div style={dividerSolid} />
              <div style={totalRow}>
                <span style={totalLabel}>Total Amount</span>
                <span style={totalValue}>₦{paymentStatus?.amount?.toLocaleString() || '0'}</span>
              </div>
            </div>

            {paymentStatus?.customerName && (
              <div style={customerBox}>
                <span style={infoLabel}>CUSTOMER</span>
                <div style={{fontWeight: 600, color: '#1e293b'}}>{paymentStatus.customerName}</div>
                <div style={{fontSize: 12, color: '#64748b'}}>{paymentStatus.customerEmail}</div>
              </div>
            )}
          </div>

          <div style={receiptFooter}>
            <div style={barcodePlaceholder} />
            <p style={footerNote}>Generated by Luter Payment System</p>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}

const pageWrapperStyles = { minHeight: '100vh', background: '#f1f5f9', display: 'flex', flexDirection: 'column', fontFamily: "'Outfit', sans-serif" };
const containerStyles = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' };
const spinnerContainerStyles = { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 };
const spinnerStyles = { width: 40, height: 40, border: '3px solid #e2e8f0', borderTop: '3px solid #7a12cc', borderRadius: '50%', animation: 'spin 1s linear infinite' };
const headerStyles = { padding: '16px 24px', background: '#ffffff', borderBottom: '1px solid #e2e8f0' };
const headerInnerStyles = { maxWidth: 1000, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const backBtnStyles = { display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: 14 };
const actionBtnStyles = { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#7a12cc', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease', fontSize: 14 };
const contentAreaStyles = { flex: 1, display: 'flex', justifyContent: 'center', padding: '40px 20px' };
const receiptCardStyles = { background: '#ffffff', width: '100%', maxWidth: '420px', borderRadius: '24px', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.08)', overflow: 'hidden', height: 'fit-content' };
const ticketHoleLeft = { position: 'absolute', width: 20, height: 20, borderRadius: '50%', background: '#f1f5f9', left: -10, top: '35%', zIndex: 10 };
const ticketHoleRight = { position: 'absolute', width: 20, height: 20, borderRadius: '50%', background: '#f1f5f9', right: -10, top: '35%', zIndex: 10 };
const receiptHeader = { padding: '40px 32px 24px', textAlign: 'center' };
const logoContainer = { marginBottom: 20 };
const logoText = { fontSize: 28, fontWeight: 900, color: '#1e293b', letterSpacing: '-1px' };
const successIconContainer = { width: 80, height: 80, background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' };
const receiptTitle = { fontSize: 24, fontWeight: 800, color: '#1e293b', margin: '0 0 8px 0' };
const receiptSubtitle = { fontSize: 14, color: '#64748b', margin: 0 };
const dividerDashed = { borderTop: '2px dashed #e2e8f0', margin: '0 32px' };
const dividerSolid = { borderTop: '1px solid #e2e8f0', margin: '16px 0' };
const receiptBody = { padding: '32px' };
const infoGrid = { display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 24 };
const infoItem = { display: 'flex', flexDirection: 'column', gap: 4 };
const infoLabel = { fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' };
const infoValue = { fontSize: 14, fontWeight: 600, color: '#334155', wordBreak: 'break-all' };
const paymentSummaryBox = { background: '#f8fafc', borderRadius: 16, padding: '20px' };
const summaryRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 };
const summaryLabel = { fontSize: 13, color: '#64748b' };
const summaryValue = { fontSize: 13, fontWeight: 600, color: '#1e293b' };
const totalRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const totalLabel = { fontSize: 15, fontWeight: 700, color: '#1e293b' };
const totalValue = { fontSize: 18, fontWeight: 800, color: '#7a12cc' };
const customerBox = { marginTop: 24, padding: '0 4px' };
const receiptFooter = { padding: '0 32px 40px', textAlign: 'center' };
const barcodePlaceholder = { height: 40, background: 'linear-gradient(to right, #1e293b 2px, transparent 2px)', backgroundSize: '6px 100%', marginBottom: 12, opacity: 0.1 };
const footerNote = { fontSize: 11, color: '#94a3b8', margin: 0 };
