const fs = require('fs');
const path = 'c:/Softwares/Luter/src/components/dashboard/UpgradePage.jsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('const [selectedPlanId, setSelectedPlanId]')) {
  content = content.replace(
    "const currentTier = (profile?.subscription_tier || 'free').toLowerCase()",
    "const [selectedPlanId, setSelectedPlanId] = useState('pro')\n  const currentTier = (profile?.subscription_tier || 'free').toLowerCase()"
  );
}

const returnIndex = content.indexOf('  return (\n    <div className="upg-outer">');
if (returnIndex === -1) {
  console.log('Could not find return statement');
  process.exit(1);
}

const newReturn = `  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      width: '100%',
      margin: 0,
      padding: 0,
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        margin: '0 auto',
        paddingTop: '64px',
        paddingBottom: '32px',
        width: '100%',
        position: 'relative'
      }}>
        {/* Iridescent Background Overlay */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'radial-gradient(136.01% 102.76% at 100% 0%, rgb(253, 237, 211) 0%, rgb(255, 255, 255) 24.5%, rgb(255, 255, 255) 60.5%, rgb(238, 240, 255) 86.5%, rgb(228, 233, 255) 100%)',
          zIndex: -1
        }} />

        {message && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px', zIndex: 10 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 16px',
              borderRadius: '9999px',
              border: '1.5px solid #1a1a1a',
              fontSize: '14px',
              fontWeight: 700,
              background: '#FFFFFF',
              color: '#1a1a1a'
            }}>
              <ShieldCheck size={16} weight="fill" />
              <span>{message}</span>
            </div>
          </div>
        )}

        {/* Content Wrapper */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          zIndex: 1,
          padding: '0 24px'
        }}>
          {/* Header Illustration */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '32px'
          }}>
            <svg width="76" height="76" viewBox="0 0 114 96" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', margin: '0 auto', filter: 'drop-shadow(0px 8px 16px rgba(0,0,0,0.1))' }}>
              <path d="M29.6108 55.4542L29.5601 55.4542L36.3195 67.2413L29.6108 55.4542Z" fill="#624CE0"></path>
              <path d="M48.887 88.9485C46.8839 92.4285 43.149 94.595 39.1245 94.595H11.2386C5.07475 94.595 1.20641 87.9255 4.26767 82.5855L31.3396 35.3478C33.3427 31.8678 37.0776 29.7013 41.1021 29.7013H68.988C75.1518 29.7013 79.0202 36.3708 75.9589 41.7108L48.887 88.9485Z" fill="url(#paint0_linear)"></path>
              <path d="M70.3664 35.3478C72.3695 31.8678 76.1043 29.7013 80.1288 29.7013H93.3662C99.5301 29.7013 103.398 36.3708 100.337 41.7108L73.2652 88.9485C71.2621 92.4285 67.5273 94.595 63.5028 94.595H50.2654C44.1015 94.595 40.2332 87.9255 43.2944 82.5855L70.3664 35.3478Z" fill="#22165F"></path>
              <path d="M88.7562 35.3478C90.7593 31.8678 94.4942 29.7013 98.5187 29.7013H102.761C108.925 29.7013 112.794 36.3708 109.732 41.7108L82.6606 88.9485C80.6575 92.4285 76.9227 94.595 72.8982 94.595H68.6558C62.492 94.595 58.6236 87.9255 61.6848 82.5855L88.7562 35.3478Z" fill="#624CE0"></path>
              <path d="M38.8344 61.1219H55.458V69.7548H38.8344V61.1219Z" fill="#E5B551"></path>
              <path d="M68.5284 10.3702C66.5252 6.89018 62.7904 4.72363 58.7659 4.72363H30.88C24.7161 4.72363 20.8478 11.3931 23.9091 16.7331L35.2979 36.6025L43.8329 21.7139C45.836 18.2339 49.5709 16.0673 53.5953 16.0673H63.6334L68.5284 10.3702Z" fill="#FFECA0"></path>
              <path d="M30.6542 4.72363C26.6297 4.72363 22.8948 6.89018 20.8917 10.3702L16.4443 18.1278L26.4824 18.1278C30.5069 18.1278 34.2417 20.2944 36.2449 23.7744L43.0807 35.6983L54.4695 16.7331C57.5307 11.3931 53.6624 4.72363 47.4985 4.72363H30.6542Z" fill="#DCA23A"></path>
              <defs>
                <linearGradient id="paint0_linear" x1="23.1165" y1="38.8893" x2="60.0105" y2="103.22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FFECA0"></stop>
                  <stop offset="1" stopColor="#E5B551"></stop>
                </linearGradient>
              </defs>
            </svg>
          </div>

          <h1 style={{
            fontFamily: '"Georgia", serif',
            fontSize: '32px',
            color: '#1a1a1a',
            fontWeight: 400,
            textAlign: 'center',
            marginBottom: '16px',
            lineHeight: 1.2
          }}>Unlock the full Brilliant experience</h1>
          
          <p style={{
            textAlign: 'center',
            fontSize: '16px',
            color: '#1a1a1a',
            marginBottom: '32px'
          }}>Premium gives you unlimited learning, personalized tutoring, and more.</p>

          {/* Billing Cycle Selector */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
            <div style={{
              display: 'flex',
              background: 'rgba(0,0,0,0.06)',
              borderRadius: '9999px',
              padding: '4px',
            }}>
              {currency === 'NGN' && (
                <button
                  onClick={() => setBillingCycle('weekly')}
                  style={{
                    padding: '8px 24px',
                    borderRadius: '9999px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: billingCycle === 'weekly' ? '#1a1a1a' : 'transparent',
                    color: billingCycle === 'weekly' ? '#fff' : '#1a1a1a',
                    transition: 'all 0.2s'
                  }}
                >
                  Weekly
                </button>
              )}
              <button
                onClick={() => setBillingCycle('monthly')}
                style={{
                  padding: '8px 24px',
                  borderRadius: '9999px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: billingCycle === 'monthly' ? '#1a1a1a' : 'transparent',
                  color: billingCycle === 'monthly' ? '#fff' : '#1a1a1a',
                  transition: 'all 0.2s'
                }}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                style={{
                  padding: '8px 24px',
                  borderRadius: '9999px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: billingCycle === 'yearly' ? '#1a1a1a' : 'transparent',
                  color: billingCycle === 'yearly' ? '#fff' : '#1a1a1a',
                  transition: 'all 0.2s'
                }}
              >
                Yearly
              </button>
            </div>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: '20px',
            width: '100%',
            maxWidth: '1000px',
            paddingBottom: '32px'
          }}>
            
            {currentPlansList.map(plan => {
              const isSelected = selectedPlanId === plan.id;
              const isPro = plan.id === 'pro';
              const cycle = plan.cycles[billingCycle] || plan.cycles['monthly'];
              const isCurrentTier = plan.id === currentTier;

              if (isPro) {
                return (
                  <div key={plan.id} style={{
                    position: 'relative',
                    flex: '1 1 280px',
                    maxWidth: '320px',
                    padding: '28px 4px 4px 4px',
                    borderRadius: '20px',
                    background: isSelected 
                      ? 'linear-gradient(86deg, #7491FF -7.44%, #FF90E0 44.8%, #F7C325 102.54%)' 
                      : 'rgba(0,0,0,0.06)',
                    cursor: isCurrentTier ? 'default' : 'pointer',
                    transition: 'all 0.2s ease',
                    transform: isSelected ? 'translateY(-4px)' : 'none',
                    boxShadow: isSelected ? '0 12px 24px rgba(0,0,0,0.1)' : 'none'
                  }}
                  onClick={() => !isCurrentTier && setSelectedPlanId(plan.id)}
                  >
                    {isSelected && (
                      <div style={{
                        position: 'absolute',
                        top: '-26px',
                        left: 0,
                        right: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        pointerEvents: 'none'
                      }}>
                        <svg width="40" height="26" viewBox="0 0 40 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10.4283 25.1325C10.4283 24.3638 10.4571 23.3216 10.5109 21.906C10.6033 19.4697 10.7416 16.5491 10.875 14.5029C11.1448 10.3702 12.0006 6.57723 15.6963 3.6559C16.8967 2.70513 18.3582 2.06201 19.8973 1.80211C21.4365 1.54222 22.9866 1.67756 24.3541 2.18873C27.9739 3.53503 29.3512 6.77259 29.5843 10.1582C29.691 11.6967 29.8038 13.916 29.882 16.1437C29.9324 17.5855 29.9572 18.7758 29.9572 19.643" stroke="#161616" strokeWidth="2.84" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"></path>
                          <path d="M13.6289 19.9861C13.6289 18.0649 13.5852 14.8524 13.5415 12.8986" stroke="#161616" strokeWidth="2.84" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"></path>
                          <path d="M26.2372 19.9862C26.2372 18.4411 26.2809 15.3934 26.2809 13.693" stroke="#161616" strokeWidth="2.84" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"></path>
                          <path d="M10.767 15.3403H28.9177" stroke="#161616" strokeWidth="2.84" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"></path>
                          <path d="M18.8232 20.3548C18.8232 20.3548 19.0142 21.0315 19.8258 21.0315C20.6373 21.0315 20.8284 20.3548 20.8284 20.3548" stroke="#161616" strokeWidth="2.84" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"></path>
                        </svg>
                      </div>
                    )}
                    
                    {isSelected && (
                      <p style={{
                        position: 'absolute',
                        top: '4px',
                        left: '0',
                        right: '0',
                        textAlign: 'center',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#1a1a1a',
                        textTransform: 'uppercase',
                        margin: 0
                      }}>MOST POPULAR</p>
                    )}
                    
                    <div style={{
                      background: '#fff',
                      borderRadius: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '120px',
                      padding: '16px 20px',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.02)',
                      border: isSelected ? 'none' : '1px solid rgba(0,0,0,0.08)'
                    }}>
                      <p style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: '#1a1a1a' }}>{plan.name}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '18px', color: '#1a1a1a' }}>{cycle.price}</span>
                        <span style={{ fontSize: '16px', color: '#666' }}>{cycle.sub}</span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#666', margin: 0, textAlign: 'center' }}>{cycle.naira}</p>
                      {isCurrentTier && (
                         <div style={{ marginTop: '12px', background: '#e2e8f0', color: '#475569', fontSize: '12px', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold' }}>Current Plan</div>
                      )}
                    </div>
                  </div>
                )
              }

              return (
                <div key={plan.id} style={{
                  position: 'relative',
                  flex: '1 1 280px',
                  maxWidth: '320px',
                  padding: '4px',
                  borderRadius: '20px',
                  background: isSelected ? '#1a1a1a' : 'rgba(0,0,0,0.06)',
                  cursor: isCurrentTier ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  transform: isSelected ? 'translateY(-4px)' : 'none',
                  boxShadow: isSelected ? '0 12px 24px rgba(0,0,0,0.1)' : 'none'
                }}
                onClick={() => !isCurrentTier && setSelectedPlanId(plan.id)}
                >
                  <div style={{
                    background: '#fff',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '120px',
                    padding: '16px 20px',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.02)',
                    border: isSelected ? 'none' : '1px solid rgba(0,0,0,0.08)'
                  }}>
                    <p style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: '#1a1a1a' }}>{plan.name}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '18px', color: '#1a1a1a' }}>{cycle.price}</span>
                      <span style={{ fontSize: '16px', color: '#666' }}>{cycle.sub}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#666', margin: 0, textAlign: 'center' }}>{cycle.naira}</p>
                    {isCurrentTier && (
                         <div style={{ marginTop: '12px', background: '#e2e8f0', color: '#475569', fontSize: '12px', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold' }}>Current Plan</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          
          <p style={{ fontSize: '12px', color: '#666', textAlign: 'center', marginTop: '16px', maxWidth: '600px' }}>
            *Billed as one payment. Renews {billingCycle}. Cancel anytime. You can turn off auto-renew from your settings.
          </p>

        </div>

        {/* Sticky Footer */}
        <div style={{
          position: 'sticky',
          bottom: 0,
          left: 0,
          width: '100%',
          padding: '24px',
          background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, #FFFFFF 30%)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10
        }}>
          <button 
            disabled={submitting !== null || selectedPlanId === currentTier || selectedPlanId === 'free'}
            onClick={() => handleUpgrade(selectedPlanId)}
            onMouseDown={(e) => {
               if(submitting !== null || selectedPlanId === currentTier || selectedPlanId === 'free') return;
               e.currentTarget.querySelector('span[data-face]').style.transform = 'translateY(0)';
               e.currentTarget.querySelector('span[data-face]').style.boxShadow = 'none';
            }}
            onMouseUp={(e) => {
               if(submitting !== null || selectedPlanId === currentTier || selectedPlanId === 'free') return;
               e.currentTarget.querySelector('span[data-face]').style.transform = 'translateY(-4px)';
               e.currentTarget.querySelector('span[data-face]').style.boxShadow = '0 4px 0 0 #1a1a1a';
            }}
            onMouseLeave={(e) => {
               if(submitting !== null || selectedPlanId === currentTier || selectedPlanId === 'free') return;
               e.currentTarget.querySelector('span[data-face]').style.transform = 'translateY(-4px)';
               e.currentTarget.querySelector('span[data-face]').style.boxShadow = '0 4px 0 0 #1a1a1a';
            }}
            style={{
              padding: 0,
              border: 'none',
              background: 'transparent',
              position: 'relative',
              width: '100%',
              maxWidth: '358px',
              borderRadius: '56px',
              cursor: (submitting !== null || selectedPlanId === currentTier || selectedPlanId === 'free') ? 'not-allowed' : 'pointer',
              opacity: (submitting !== null || selectedPlanId === currentTier || selectedPlanId === 'free') ? 0.6 : 1
            }}
          >
            <span data-face="true" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              padding: '14px 24px',
              borderRadius: '60px',
              background: '#2a2a2a',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 700,
              border: '1.5px solid #1a1a1a',
              transform: 'translateY(-4px)',
              boxShadow: '0 4px 0 0 #1a1a1a',
              transition: 'transform 0.1s cubic-bezier(0,0,0.2,1), box-shadow 0.1s cubic-bezier(0,0,0.2,1)'
            }}>
              {submitting !== null ? 'Processing...' : 'Subscribe now'}
            </span>
          </button>
        </div>

        {/* Admin Debug Toggle */}
        {isAdmin && !loadingSettings && (
          <div style={{ marginTop: 'auto', padding: '24px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.05)', padding: '12px 24px', borderRadius: '16px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700 }}>Admin: Mode [{paymentMode}]</span>
              <button onClick={togglePaymentMode} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                {paymentMode === 'live' ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
`;
content = content.substring(0, returnIndex) + newReturn;

fs.writeFileSync(path, content, 'utf8');
console.log('Update complete');
