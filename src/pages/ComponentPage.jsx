import React, { useState } from 'react';
import StreakHeatmap from '../components/dashboard/StreakHeatmap';
import CalendarHeatmap from '../components/dashboard/CalendarHeatmap';
import CourseCardSwiper from '../components/dashboard/CourseCardSwiper';
import ExploreTasksWidget from '../components/dashboard/ExploreTasksWidget';
import GamifiedProgressBars from '../components/dashboard/GamifiedProgressBars';
import ChatBubblesWidget from '../components/dashboard/ChatBubblesWidget';
import QuitOverlaysWidget from '../components/dashboard/QuitOverlaysWidget';
import StackedStartCard from '../components/dashboard/StackedStartCard';
import TodoListWidget from '../components/dashboard/TodoListWidget';
import CalendarWidget from '../components/dashboard/CalendarWidget';
import StudyProgressWidget from '../components/dashboard/StudyProgressWidget';
import PersonalLibraryWidget from '../components/dashboard/PersonalLibraryWidget';
import RecentlyStudiedWidget from '../components/dashboard/RecentlyStudiedWidget';

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0 }}>
    <rect x="2" y="2" width="24" height="24" rx="12" fill="#FFCC9C"></rect>
    <rect x="2" y="2" width="24" height="24" rx="12" stroke="url(#ck-grad)" strokeWidth="4"></rect>
    <path d="M21.0718 10.1095L19.6576 8.69531L11.8794 16.4735L8.3439 12.938L6.92969 14.3522L11.8794 19.302L21.0718 10.1095Z" fill="#291502"></path>
    <defs>
      <linearGradient id="ck-grad" x1="1.91667" y1="4" x2="19.4167" y2="21.5" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF8D23" stopOpacity="0"></stop>
        <stop offset="1" stopColor="#FF8D23" stopOpacity="0.2"></stop>
      </linearGradient>
    </defs>
  </svg>
);

const CrossIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, color: '#B3B3B3' }}>
    <path fillRule="evenodd" clipRule="evenodd" d="M10 0C4.47715 0 0 4.47715 0 10C0 15.5228 4.47715 20 10 20C15.5228 20 20 15.5228 20 10C20 4.47715 15.5228 0 10 0ZM5.66872 4.4317L9.99979 8.76277L14.3308 4.43178L15.5682 5.66922L11.2372 10.0002L15.5682 14.3312L14.3308 15.5686L9.99979 11.2376L5.66871 15.5687L4.43127 14.3313L8.76235 10.0002L4.43129 5.66914L5.66872 4.4317Z" fill="currentColor"></path>
  </svg>
);

const ComponentPage = () => {
  const [isXpOpen, setIsXpOpen] = useState(false);
  const [isKeysOpen, setIsKeysOpen] = useState(false);
  const [isPremiumOpen, setIsPremiumOpen] = useState(false);
  const [isPlansOpen, setIsPlansOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);


  const benefits = [
    { label: 'Daily lesson', free: true, premium: true },
    { label: 'Unlimited learning', free: false, premium: true },
    { label: 'Tutoring by Lumii', free: false, premium: true },
    { label: 'No ads', free: false, premium: true },
    { label: 'Jump ahead and personalized practice', free: false, premium: true },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: isDarkTheme ? '#0F172A' : '#F8FAFC',
      padding: '40px',
      fontFamily: 'Outfit, sans-serif',
      transition: 'background 0.2s ease'
    }}>
      <style>{`
        .premium-btn {
          transition: all 0.05s ease;
        }
        .premium-btn:hover {
          background: linear-gradient(#fff, #fff) padding-box, linear-gradient(86deg, #4A6DFF 0%, #FF52C8 50%, #EAB308 100%) border-box !important;
        }
        .pill-btn {
          transition: border-color 0.05s ease;
        }
        .pill-btn:hover {
          border-color: #94A3B8 !important;
        }
        .btn3d {
          transition: opacity 0.1s ease;
        }
        .btn3d:hover {
          opacity: 0.85;
        }
      `}</style>

      {/* Theme Toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <button 
          onClick={() => setIsDarkTheme(!isDarkTheme)}
          style={{
             padding: '10px 20px',
             borderRadius: '8px',
             background: isDarkTheme ? '#1E293B' : '#fff',
             color: isDarkTheme ? '#F8FAFC' : '#0F172A',
             border: `1px solid ${isDarkTheme ? '#334155' : '#E2E8F0'}`,
             cursor: 'pointer',
             fontWeight: 600,
             display: 'flex',
             alignItems: 'center',
             gap: '8px'
          }}>
          {isDarkTheme ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>

      {/* The Calendar and Study Progress widgets are already below, removing the duplicate block */}

      {/* Personal Library Section */}
      <div style={{ marginBottom: '40px' }}>
        <PersonalLibraryWidget isDark={isDarkTheme} />
      </div>

      {/* Recently Studied Section */}
      <div style={{ marginBottom: '40px' }}>
        <RecentlyStudiedWidget isDark={isDarkTheme} />
      </div>

      {/* Mini Streak and Tasks Section */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '40px', alignItems: 'flex-start' }}>
         <div style={{ maxWidth: '400px', width: '100%' }}>
            <StreakHeatmap isDark={isDarkTheme} targetStreak={3} />
         </div>
         <div style={{ width: '100%', maxWidth: '480px' }}>
            <ExploreTasksWidget isDark={isDarkTheme} />
         </div>
      </div>

      {/* Gamified Progress Bars Section */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '40px', alignItems: 'flex-start', justifyContent: 'center' }}>
         <GamifiedProgressBars isDark={isDarkTheme} />
      </div>

      {/* Stacked Start Card Section */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '40px', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
         <StackedStartCard isDark={isDarkTheme} />
      </div>

      {/* Todo List, Calendar, and Study Progress Section */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '40px', alignItems: 'flex-start', justifyContent: 'center', flexWrap: 'wrap' }}>
         <div style={{ width: '100%', maxWidth: '480px' }}>
            <TodoListWidget isDark={isDarkTheme} />
         </div>
         <div style={{ width: '100%', maxWidth: '480px' }}>
            <CalendarWidget isDark={isDarkTheme} />
         </div>
         <div style={{ width: '100%', maxWidth: '480px' }}>
            <StudyProgressWidget isDark={isDarkTheme} />
         </div>
      </div>

      {/* Course Cards Swiper Section */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '40px', alignItems: 'flex-start', justifyContent: 'center' }}>
         <CourseCardSwiper isDark={isDarkTheme} />
      </div>

      {/* Header buttons row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        width: '100%',
        gap: '12px'
      }}>
        {/* Go Premium Button */}
        <button className="premium-btn" onClick={() => setIsPremiumOpen(true)} style={{
          padding: '8px 16px',
          borderRadius: '9999px',
          border: '2px solid transparent',
          background: 'linear-gradient(#fff, #fff) padding-box, linear-gradient(86deg, #7491FF 0%, #FF90E0 50%, #F9D25C 100%) border-box',
          color: '#142563',
          fontWeight: 600,
          fontSize: '15px',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          outline: 'none'
        }}>
          Go Premium
        </button>

        {/* Keys Button Wrapper */}
        <div style={{ position: 'relative' }}>
          <button 
            className="pill-btn" 
            onClick={() => {
              setIsKeysOpen(!isKeysOpen);
              setIsXpOpen(false);
            }}
            style={{
              padding: '8px 20px',
              borderRadius: '9999px',
              border: '2px solid #E2E8F0',
              background: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#000' }}>2</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="22px" height="22px" viewBox="0 0 24 25" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M14.4817 19.6977L11.999 21.1161L9.52933 19.6752L9.54232 16.816L11.4342 15.7351L11.4622 9.58023L14.9175 8.47371L14.9161 8.47119L14.9316 5.04609L12.6755 5.76237L11.4778 6.12943L11.481 5.42512L11.4828 5.04461L11.8454 4.92947L14.9366 3.94805L14.9447 2.17121C14.9483 1.37199 14.189 0.789447 13.418 0.999965L9.98967 1.93603C9.53685 2.05967 9.22203 2.47004 9.2199 2.93943L9.17475 12.8808L7.00035 14.123C6.35198 14.4934 5.95048 15.1816 5.94709 15.9283L5.92619 20.5302C5.9228 21.2769 6.31803 21.9687 6.96301 22.345L10.9379 24.664C11.5828 25.0403 12.3796 25.0439 13.0279 24.6735L17.0237 22.3907C17.672 22.0202 18.0735 21.3321 18.0769 20.5853L18.0978 15.9835C18.1012 15.2368 17.706 14.545 17.061 14.1687L14.8959 12.9056L14.911 9.59355L12.5037 10.3641L12.4796 15.6628L14.4947 16.8385L14.4817 19.6977Z" fill="#F7C325"></path>
            </svg>
          </button>

          {/* Keys Dropdown Card */}
          {isKeysOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '12px',
              background: '#fff',
              borderRadius: '24px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              border: '1px solid #E2E8F0',
              width: '320px',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '24px',
              zIndex: 50,
              cursor: 'default'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '36px', fontWeight: 800, color: '#000', lineHeight: 1 }}>2</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="51px" height="94px" viewBox="0 0 51 94" fill="none" style={{ flexShrink: 0 }}>
                    <g clipPath="url(#:r7f:)">
                      <g clipPath="url(#:r7g:)">
                        <path fillRule="evenodd" clipRule="evenodd" d="M34.5185 74.5894L25.7161 79.6715L16.9137 74.5894L16.9136 64.4252L23.6247 60.5506L23.6247 38.6682L27.3397 37.4599L27.3397 37.4612L35.8845 34.6834L35.8845 34.6807L35.8898 34.679L35.8845 34.6695L35.8845 22.4941L27.8416 25.0879L23.6247 26.4012L23.6247 23.8971L23.6247 22.5444L24.9121 22.1293L35.8845 18.5907L35.8845 12.2791C35.8845 9.43802 33.1758 7.3795 30.4384 8.14028L18.2668 11.5231C16.6591 11.9699 15.5466 13.4338 15.5466 15.1024L15.5466 50.4407L7.83408 54.8935C5.53527 56.2207 4.11914 58.6735 4.11914 61.328L4.11914 77.6867C4.11914 80.3411 5.53527 82.7939 7.83408 84.1211L22.0011 92.3005C24.2999 93.6277 27.1322 93.6277 29.431 92.3005L43.5981 84.1211C45.8969 82.7939 47.313 80.3411 47.313 77.6867L47.313 61.328C47.313 58.6735 45.8969 56.2207 43.5981 54.8935L35.8845 50.4401L35.8845 38.6631L27.3397 41.4409L27.3397 60.2805L34.5185 64.4252L34.5185 74.5894Z" fill="#B78900"></path>
                        <mask id=":r7h:" maskUnits="userSpaceOnUse" x="4" y="7" width="44" height="87" style={{maskType: "alpha"}}>
                          <path fillRule="evenodd" clipRule="evenodd" d="M34.5019 74.5892L25.6995 79.6712L16.897 74.5892L16.897 64.425L23.6081 60.5504L23.6081 38.6682L27.3231 37.4599L27.3231 37.461L35.8679 34.6832L35.8679 34.6807L35.8738 34.6787L35.8679 34.6681L35.8679 22.4938L27.8053 25.094L23.6081 26.4011L23.6081 23.8968L23.6081 22.5442L24.8955 22.129L35.8679 18.5905L35.8679 12.2789C35.8679 9.43778 33.1592 7.37925 30.4218 8.14004L18.2502 11.5229C16.6425 11.9697 15.53 13.4336 15.53 15.1022L15.53 50.4404L7.81748 54.8933C5.51866 56.2205 4.10254 58.6733 4.10254 61.3277L4.10254 77.6864C4.10254 80.3409 5.51867 82.7937 7.81748 84.1209L21.9845 92.3002C24.2833 93.6275 27.1156 93.6275 29.4144 92.3002L43.5815 84.1209C45.8803 82.7937 47.2964 80.3409 47.2964 77.6864L47.2964 61.3277C47.2964 58.6733 45.8803 56.2205 43.5815 54.8933L35.8679 50.4398L35.8679 38.6629L27.3231 41.4407L27.3231 60.2803L34.5019 64.425L34.5019 74.5892Z" fill="#F7C325"></path>
                        </mask>
                        <g mask="url(#:r7h:)">
                          <rect x="-0.989258" y="90.8528" width="26.7055" height="10.1932" transform="rotate(-90 -0.989258 90.8528)" fill="#D7A613"></rect>
                          <rect x="25.7275" y="95.4495" width="26.7055" height="6.24292" transform="rotate(-90 25.7275 95.4495)" fill="#926D00"></rect>
                          <rect width="11.5213" height="9.21356" transform="matrix(-4.37114e-08 -1 -1 4.37114e-08 24.8652 65.1226)" fill="#5C4400"></rect>
                          <rect width="11.5213" height="17.2607" transform="matrix(-4.37114e-08 -1 -1 4.37114e-08 37.1943 23.3843)" fill="#5C4400"></rect>
                          <rect width="13.324" height="17.2607" transform="matrix(-4.37114e-08 -1 -1 4.37114e-08 37.1943 39.8523)" fill="#5C4400"></rect>
                          <rect width="26.7055" height="16.3686" transform="matrix(-4.37114e-08 -1 -1 4.37114e-08 48.3438 95.4495)" fill="#5C4400"></rect>
                        </g>
                        <path fillRule="evenodd" clipRule="evenodd" d="M34.5097 68.7056L25.7073 73.7877L16.9049 68.7056L16.9049 58.5414L23.6159 54.6668L23.6159 32.7842L27.3309 31.5759L27.3309 31.5772L35.8757 28.7994L35.8757 28.7967L35.8817 28.7947L35.8757 28.7841L35.8757 16.61L27.8324 19.2039L23.6159 20.5171L23.6159 18.013L23.6159 16.6604L24.9033 16.2452L35.8757 12.7067L35.8757 6.39534C35.8757 3.55423 33.167 1.49571 30.4297 2.25649L18.258 5.63933C16.6504 6.08614 15.5378 7.55002 15.5378 9.21861L15.5378 44.5569L7.82529 49.0097C5.52648 50.3369 4.11035 52.7897 4.11035 55.4442L4.11035 71.8029C4.11035 74.4573 5.52648 76.9101 7.82529 78.2373L21.9923 86.4167C24.2912 87.7439 27.1234 87.7439 29.4222 86.4167L43.5893 78.2373C45.8881 76.9101 47.3042 74.4573 47.3042 71.8029L47.3042 55.4442C47.3042 52.7897 45.8881 50.3369 43.5893 49.0097L35.8757 44.5563L35.8757 32.7791L27.3309 35.5569L27.3309 54.3967L34.5097 58.5414L34.5097 68.7056Z" fill="#F7C325"></path>
                        <mask id=":r7i:" maskUnits="userSpaceOnUse" x="4" y="2" width="44" height="86" style={{maskType: "alpha"}}>
                          <path fillRule="evenodd" clipRule="evenodd" d="M34.5058 68.7046L25.7034 73.7867L16.901 68.7046L16.901 58.5405L23.612 54.6658L23.612 32.783L27.327 31.5747L27.327 31.5762L35.8718 28.7984L35.8718 28.7955L35.8778 28.7936L35.8718 28.783L35.8718 16.609L27.8444 19.1978L23.612 20.516L23.612 18.0121L23.612 16.6594L24.8994 16.2442L35.8718 12.7057L35.8718 6.39436C35.8718 3.55325 33.1631 1.49473 30.4257 2.25552L18.2541 5.63836C16.6464 6.08517 15.5339 7.54904 15.5339 9.21764L15.5339 44.5559L7.82138 49.0087C5.52257 50.336 4.10644 52.7888 4.10644 55.4432L4.10645 71.8019C4.10645 74.4563 5.52257 76.9091 7.82139 78.2364L21.9884 86.4157C24.2873 87.7429 27.1195 87.7429 29.4183 86.4157L43.5854 78.2364C45.8842 76.9091 47.3003 74.4563 47.3003 71.8019L47.3003 55.4432C47.3003 52.7888 45.8842 50.336 43.5854 49.0087L35.8718 44.5553L35.8718 32.7781L27.327 35.5559L27.327 54.3958L34.5058 58.5405L34.5058 68.7046Z" fill="#F7C325"></path>
                        </mask>
                        <g mask="url(#:r7i:)">
                          <rect x="-17.335" y="44.6023" width="37.6816" height="77.6601" transform="rotate(-60 -17.335 44.6023)" fill="#F9D25C"></rect>
                        </g>
                      </g>
                    </g>
                    <defs>
                      <clipPath id=":r7f:">
                        <rect width="50" height="93.75" fill="white" transform="translate(0.5)"></rect>
                      </clipPath>
                      <clipPath id=":r7g:">
                        <rect width="85.6477" height="85.6477" fill="white" transform="translate(-34.3896 47.521) rotate(-45)"></rect>
                      </clipPath>
                    </defs>
                  </svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#000', margin: 0 }}>You have 2 keys left today</h4>
                  <span style={{ fontSize: '15px', color: '#64748B', fontWeight: 500, margin: 0 }}>Use keys to unlock lessons</span>
                </div>
              </div>
              
              <button style={{
                width: '100%',
                padding: '16px 24px',
                borderRadius: '16px',
                background: 'linear-gradient(86deg, #7491FF -7.44%, #FF90E0 44.8%, #F7C325 102.54%)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '16px',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                outline: 'none',
                boxShadow: '0 4px 15px rgba(255, 144, 224, 0.4)'
              }}>
                Unlock all lessons now
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
                  <svg viewBox="0 0 150 56" focusable="false" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                    <g clipPath="url(#:r7l:)">
                      <rect opacity="0.4" x="75" y="-58.6328" width="51" height="150" transform="rotate(30 75 -58.6328)" fill="url(#:r7j:)"></rect>
                      <rect opacity="0.4" x="127.826" y="-28.1328" width="26" height="150" transform="rotate(30 127.826 -28.1328)" fill="url(#:r7k:)"></rect>
                    </g>
                    <defs>
                      <linearGradient id=":r7j:" x1="100.5" y1="-58.6328" x2="100.5" y2="91.3672" gradientUnits="userSpaceOnUse">
                        <stop offset="0.27" stopColor="#F5EFFF"></stop>
                        <stop offset="0.71" stopColor="white" stopOpacity="0"></stop>
                      </linearGradient>
                      <linearGradient id=":r7k:" x1="140.826" y1="-28.1328" x2="140.826" y2="121.867" gradientUnits="userSpaceOnUse">
                        <stop offset="0.081302" stopColor="#F5EFFF"></stop>
                        <stop offset="0.570844" stopColor="white" stopOpacity="0"></stop>
                      </linearGradient>
                      <clipPath id=":r7l:">
                        <rect width="150" height="56" fill="white"></rect>
                      </clipPath>
                    </defs>
                  </svg>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Lightning Button Wrapper */}
        <div style={{ position: 'relative' }}>
          <button 
            className="pill-btn" 
            onClick={() => {
              setIsXpOpen(!isXpOpen);
              setIsKeysOpen(false);
            }}
            style={{
              padding: '8px 20px',
              borderRadius: '9999px',
              border: '2px solid #E2E8F0',
              background: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#000' }}>0</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 19 25" fill="none">
              <path d="M1.27498 12.516L10.1761 1.31828C10.7098 0.646883 11.7966 1.11739 11.6606 1.96094L10.3758 9.92921H15.8888C16.9368 9.92921 17.5236 11.1248 16.8757 11.94L7.97457 23.1377C7.44087 23.8091 6.35401 23.3386 6.49003 22.495L7.7748 14.5268H2.26186C1.21381 14.5268 0.62701 13.3312 1.27498 12.516Z" fill="transparent" stroke="#E2E8F0" strokeWidth="2.5"></path>
            </svg>
          </button>

          {/* XP Dropdown Card */}
          {isXpOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '12px',
              background: '#fff',
              borderRadius: '24px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              border: '1px solid #E2E8F0',
              width: '320px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              zIndex: 50,
              cursor: 'default'
            }}>
              {/* Top Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '32px', fontWeight: 800, color: '#000', lineHeight: 1 }}>0</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 19 25" fill="none">
                    <path d="M1.27498 12.516L10.1761 1.31828C10.7098 0.646883 11.7966 1.11739 11.6606 1.96094L10.3758 9.92921H15.8888C16.9368 9.92921 17.5236 11.1248 16.8757 11.94L7.97457 23.1377C7.44087 23.8091 6.35401 23.3386 6.49003 22.495L7.7748 14.5268H2.26186C1.21381 14.5268 0.62701 13.3312 1.27498 12.516Z" fill="transparent" stroke="#E2E8F0" strokeWidth="2"></path>
                  </svg>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <rect x="4.8" y="2.4" width="14.4" height="19.2" rx="1.08" stroke="#E2E8F0" strokeWidth="3.76"></rect>
                    <path d="M9.08 0.94L14.92 0.94C15 0.94 15.06 1 15.06 1.08L15.06 1.46L8.94 1.46L8.94 1.08C8.94 1 9 0.94 9.08 0.94Z" stroke="#E2E8F0" strokeWidth="1.88"></path>
                    <path d="M9.08 23.06L14.92 23.06C15 23.06 15.06 23 15.06 22.92L15.06 22.54L8.94 22.54L8.94 22.92C8.94 23 9 23.06 9.08 23.06Z" stroke="#E2E8F0" strokeWidth="1.88"></path>
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <rect x="4.8" y="2.4" width="14.4" height="19.2" rx="1.08" stroke="#E2E8F0" strokeWidth="3.76"></rect>
                    <path d="M9.08 0.94L14.92 0.94C15 0.94 15.06 1 15.06 1.08L15.06 1.46L8.94 1.46L8.94 1.08C8.94 1 9 0.94 9.08 0.94Z" stroke="#E2E8F0" strokeWidth="1.88"></path>
                    <path d="M9.08 23.06L14.92 23.06C15 23.06 15.06 23 15.06 22.92L15.06 22.54L8.94 22.54L8.94 22.92C8.94 23 9 23.06 9.08 23.06Z" stroke="#E2E8F0" strokeWidth="1.88"></path>
                  </svg>
                </div>
              </div>

              {/* Text */}
              <span style={{ fontSize: '15px', color: '#475569', margin: 0, fontWeight: 500 }}>
                Solve <strong style={{ color: '#000', fontWeight: 800 }}>2</strong> more problems to start a streak.
              </span>

              {/* Days */}
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '8px' }}>
                {[
                  { label: 'T', active: true },
                  { label: 'W', active: false },
                  { label: 'Th', active: false },
                  { label: 'F', active: false },
                  { label: 'S', active: false }
                ].map((day, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <path fillRule="evenodd" clipRule="evenodd" d="M10.2903 16.2252L16.5654 8.24794C16.9417 7.76964 17.7079 8.10483 17.612 8.70578L16.7061 14.3834H20.5934C21.3322 14.3834 21.7459 15.2351 21.2891 15.8159L15.014 23.7931C14.6378 24.2714 13.8716 23.9362 13.9674 23.3353L14.8734 17.6577H10.9861C10.2472 17.6577 9.83354 16.8059 10.2903 16.2252Z" fill="#F1F5F9"></path>
                      <rect x="1" y="1" width="30" height="30" rx="15" stroke="#000" strokeOpacity={day.active ? 0.2 : 0.05} strokeWidth="1.5"></rect>
                    </svg>
                    <span style={{ fontSize: '15px', color: day.active ? '#000' : '#64748B', fontWeight: day.active ? 700 : 500 }}>
                      {day.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bottom Stats */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#F8FAFC',
                borderRadius: '16px',
                padding: '16px 0',
                gap: '24px',
                marginTop: '8px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#000' }}>0</span>
                  <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 500 }}>Max streak</span>
                </div>
                <div style={{ width: '1px', height: '32px', background: '#E2E8F0' }}></div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#000' }}>0</span>
                  <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 500 }}>Lessons complete</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

        {/* NEW CHAT BUBBLES SECTION */}
        <ChatBubblesWidget />

        {/* NEW QUIT OVERLAYS SECTION */}
        <QuitOverlaysWidget />
      {/* ── Standalone Button3D Component ── */}
      <div style={{ marginTop: '60px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Button 3D</span>
        <button
          className="btn3d"
          style={{
            display: 'inline-flex',
            position: 'relative',
            borderRadius: '9999px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            outline: 'none',
            padding: 0,
            minWidth: '200px',
            WebkitTapHighlightColor: 'transparent',
          }}
          onMouseDown={e => {
            const face = e.currentTarget.querySelector('[data-face]');
            face.style.transform = 'none';
            face.style.boxShadow = 'none';
          }}
          onMouseUp={e => {
            const face = e.currentTarget.querySelector('[data-face]');
            face.style.transform = 'translateY(-4px)';
            face.style.boxShadow = '0 4px 0 0 #A78BFA';
          }}
          onMouseLeave={e => {
            const face = e.currentTarget.querySelector('[data-face]');
            face.style.transform = 'translateY(-4px)';
            face.style.boxShadow = '0 4px 0 0 #A78BFA';
          }}
        >
          <span
            data-face
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              padding: '14px 32px',
              borderRadius: '9999px',
              background: '#C4B5FD',
              color: '#170B29',
              fontWeight: 700,
              fontSize: '16px',
              fontFamily: 'Outfit, sans-serif',
              position: 'relative',
              transform: 'translateY(-4px)',
              boxShadow: '0 4px 0 0 #A78BFA',
              transition: 'transform 0.1s ease-out, box-shadow 0.1s ease-out',
            }}
          >
            Subscribe now
          </span>
        </button>

        <span style={{ fontSize: '13px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '24px' }}>Plans Overlay</span>
        <button
          className="btn3d"
          onClick={() => setIsPlansOpen(true)}
          style={{
            display: 'inline-flex',
            position: 'relative',
            borderRadius: '9999px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            outline: 'none',
            padding: 0,
            minWidth: '200px',
            WebkitTapHighlightColor: 'transparent',
          }}
          onMouseDown={e => {
            const face = e.currentTarget.querySelector('[data-face]');
            face.style.transform = 'none';
            face.style.boxShadow = 'none';
          }}
          onMouseUp={e => {
            const face = e.currentTarget.querySelector('[data-face]');
            face.style.transform = 'translateY(-4px)';
            face.style.boxShadow = '0 4px 0 0 #A78BFA';
          }}
          onMouseLeave={e => {
            const face = e.currentTarget.querySelector('[data-face]');
            face.style.transform = 'translateY(-4px)';
            face.style.boxShadow = '0 4px 0 0 #A78BFA';
          }}
        >
          <span
            data-face
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              padding: '14px 32px',
              borderRadius: '9999px',
              background: '#C4B5FD',
              color: '#170B29',
              fontWeight: 700,
              fontSize: '16px',
              fontFamily: 'Outfit, sans-serif',
              position: 'relative',
              transform: 'translateY(-4px)',
              boxShadow: '0 4px 0 0 #A78BFA',
              transition: 'transform 0.1s ease-out, box-shadow 0.1s ease-out',
            }}
          >
            View Plans
          </span>
        </button>
      </div>
      {/* Premium Overlay */}
      {isPremiumOpen && (
        <div
          onClick={() => setIsPremiumOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(0deg, #FFF 49.19%, rgba(255,255,255,0) 100%), linear-gradient(0deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.75) 100%), linear-gradient(66deg, #7491FF 14.55%, #FF90E0 42.56%, #F7C325 73.53%)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '590px',
              height: '100dvh',
              display: 'flex',
              flexDirection: 'column',
              padding: '64px 20px 0',
              fontFamily: 'Outfit, sans-serif',
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsPremiumOpen(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '9999px',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666',
                zIndex: 10,
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
            </button>

            {/* Scrollable Content */}
            <div style={{ overflowY: 'auto', flexGrow: 1, paddingBottom: '120px' }}>
              {/* Heading */}
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h1 style={{
                  fontSize: '36px',
                  fontWeight: 400,
                  lineHeight: '110%',
                  letterSpacing: '-0.36px',
                  color: '#000',
                  margin: 0,
                }}>
                  Level up your learning with{' '}
                  <span style={{
                    background: 'linear-gradient(30deg, #7491FF 21.95%, #FF90E0 67.27%, #F7C325 94%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>Premium</span>
                </h1>
              </div>

              {/* Benefits Table */}
              <div style={{ display: 'flex', width: '100%', minWidth: '100%', gap: 0, marginTop: '12px' }}>
                {/* Benefits Column */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontWeight: 700, fontSize: '16px', lineHeight: 1.4, padding: '20px 0 24px', textAlign: 'left', color: '#000' }}>Benefits</div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', height: '60px', borderTop: '2px solid rgba(0,0,0,0.06)' }}>
                    <span style={{ fontSize: '15px', lineHeight: 1.5, color: '#000' }}>Daily lesson</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', height: '60px', borderTop: '2px solid rgba(0,0,0,0.06)' }}>
                    <span style={{ fontSize: '15px', lineHeight: 1.5, color: '#000' }}>Unlimited learning</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', height: '60px', borderTop: '2px solid rgba(0,0,0,0.06)' }}>
                    <span style={{ fontSize: '15px', lineHeight: 1.5, color: '#000' }}>Tutoring by Lumii</span>
                    <img src="/mascot.png" alt="Lumii" width="24" height="24" style={{ marginLeft: '6px', flexShrink: 0, objectFit: 'contain' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', height: '60px', borderTop: '2px solid rgba(0,0,0,0.06)' }}>
                    <span style={{ fontSize: '15px', lineHeight: 1.5, color: '#000' }}>No ads</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', height: '60px', borderTop: '2px solid rgba(0,0,0,0.06)' }}>
                    <span style={{ fontSize: '15px', lineHeight: 1.5, color: '#000' }}>Jump ahead and personalized practice</span>
                  </div>
                </div>

                {/* Free Column */}
                <div style={{
                  width: '108px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: 'rgba(90, 46, 163, 0.06)',
                  borderRadius: '16px 0 0 16px',
                  position: 'relative'
                }}>
                  <div style={{ fontWeight: 700, fontSize: '16px', lineHeight: 1.4, color: '#666', padding: '20px 0 24px' }}>Free</div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px', width: '100%', borderTop: '2px solid rgba(0,0,0,0.06)' }}>
                    <CheckIcon />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px', width: '100%', borderTop: '2px solid rgba(0,0,0,0.06)' }}>
                    <CrossIcon />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px', width: '100%', borderTop: '2px solid rgba(0,0,0,0.06)' }}>
                    <CrossIcon />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px', width: '100%', borderTop: '2px solid rgba(0,0,0,0.06)' }}>
                    <CrossIcon />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px', width: '100%', borderTop: '2px solid rgba(0,0,0,0.06)' }}>
                    <CrossIcon />
                  </div>
                </div>

                {/* Premium Column */}
                <div style={{
                  width: '128px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative',
                  background: 'linear-gradient(86deg, #7491FF -7.44%, #FF90E0 44.8%, #F7C325 102.54%)',
                  borderRadius: '16px',
                  padding: '4px',
                  zIndex: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}>
                  <div style={{
                    fontWeight: 700,
                    fontSize: '16px',
                    lineHeight: 1.4,
                    padding: '24px 0 24px',
                    textAlign: 'center',
                    background: 'linear-gradient(30deg, #7491FF 21.95%, #FF90E0 67.27%, #F7C325 94%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter: 'brightness(0) invert(1)',
                  }}>Premium</div>
                  
                  <div style={{ background: '#fff', borderRadius: '12px', width: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px', width: '100%' }}>
                      <CheckIcon />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px', width: '100%', borderTop: '2px solid rgba(0,0,0,0.06)' }}>
                      <CheckIcon />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px', width: '100%', borderTop: '2px solid rgba(0,0,0,0.06)' }}>
                      <CheckIcon />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px', width: '100%', borderTop: '2px solid rgba(0,0,0,0.06)' }}>
                      <CheckIcon />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px', width: '100%', borderTop: '2px solid rgba(0,0,0,0.06)' }}>
                      <CheckIcon />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Footer CTA */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: '#fff',
              padding: '20px 20px 32px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 5,
            }}>
              {/* button3d — outer shell has no bg, inner face is the visible surface */}
              <button
                className="btn3d"
                style={{
                  width: '100%',
                  maxWidth: '358px',
                  display: 'inline-flex',
                  position: 'relative',
                  borderRadius: '9999px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  outline: 'none',
                  padding: 0,
                  WebkitTapHighlightColor: 'transparent',
                }}
                onMouseDown={e => {
                  const face = e.currentTarget.querySelector('[data-face]');
                  face.style.transform = 'none';
                  face.style.boxShadow = 'none';
                }}
                onMouseUp={e => {
                  const face = e.currentTarget.querySelector('[data-face]');
                  face.style.transform = 'translateY(-4px)';
                  face.style.boxShadow = '0 4px 0 0 #A78BFA';
                }}
                onMouseLeave={e => {
                  const face = e.currentTarget.querySelector('[data-face]');
                  face.style.transform = 'translateY(-4px)';
                  face.style.boxShadow = '0 4px 0 0 #A78BFA';
                }}
              >
                <span
                  data-face
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    padding: '14px 24px',
                    borderRadius: '9999px',
                    background: '#C4B5FD',
                    color: '#170B29',
                    fontWeight: 700,
                    fontSize: '16px',
                    fontFamily: 'Outfit, sans-serif',
                    position: 'relative',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 4px 0 0 #A78BFA',
                    transition: 'transform 0.1s ease-out, box-shadow 0.1s ease-out',
                  }}
                >
                  Subscribe now
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Plans Overlay */}
      {isPlansOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100dvh',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#fff',
        }}>
          {/* Overlay background */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100dvh',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 1) 100%), #F3F4F6', // simple fallback background
            zIndex: -1,
          }} />

          {/* Scrollable Container */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100dvh',
            overflowY: 'auto',
            paddingTop: '48px',
            margin: '0 auto',
            maxWidth: '1142px',
            alignItems: 'center',
          }}>
            <button
              onClick={() => setIsPlansOpen(false)}
              style={{
                position: 'absolute',
                top: '24px',
                left: '24px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666'
              }}
            >
              <CrossIcon />
            </button>

            {/* Huge SVG Illustration */}
            <svg xmlns="http://www.w3.org/2000/svg" width="194" height="140" viewBox="0 0 194 140" fill="none" style={{ flexShrink: 0, height: 'auto', width: '211px', marginBottom: '16px' }}>
              <g clipPath="url(#clip0_1078_116898)">
                <g opacity="0.8">
                  <mask id="mask0_1078_116898" maskUnits="userSpaceOnUse" x="90" y="9" width="99" height="127" style={{ maskType: 'alpha' }}>
                    <path d="M90.166 135.855L90.166 9.59658L173.6 29.9331L172.945 81.1709L187.538 107.273C189.05 109.976 187.544 113.374 184.527 114.071L90.166 135.855Z" fill="url(#paint0_linear_1078_116898)"></path>
                  </mask>
                  <g mask="url(#mask0_1078_116898)">
                    <path opacity="0.5" d="M90.166 135.855L90.166 9.59658L173.6 29.946L172.945 81.1709L186.253 107.301C187.621 109.987 186.111 113.244 183.177 113.936L90.166 135.855Z" fill="url(#paint1_linear_1078_116898)"></path>
                  </g>
                </g>
                <path fillRule="evenodd" clipRule="evenodd" d="M187.365 60.5552C188.238 59.2183 188.283 57.5033 187.482 56.1224L175.209 34.9836C174.453 33.681 173.06 32.8794 171.554 32.8794L148.873 32.8794C147.311 32.8794 145.876 33.7409 145.143 35.1197L133.659 56.6943C132.947 58.0304 133.005 59.6448 133.81 60.9268L144.436 77.8534C145.236 79.1278 145.298 80.7316 144.599 82.064L132.853 104.445C131.376 107.259 133.417 110.635 136.595 110.635H183.72C186.898 110.635 188.939 107.259 187.462 104.445L175.8 82.2231C175.088 80.8665 175.166 79.231 176.004 77.9483L187.365 60.5552Z" fill="url(#paint2_linear_1078_116898)"></path>
                <path fillRule="evenodd" clipRule="evenodd" d="M148.653 110.631C145.621 110.518 143.673 107.309 145.022 104.552L156.281 81.5324C156.909 80.249 156.845 78.7353 156.113 77.5087L146.173 60.8676C145.414 59.5962 145.375 58.02 146.072 56.713L157.583 35.1144C158.317 33.7368 159.751 32.8761 161.312 32.876L148.862 32.876C147.307 32.876 145.877 33.73 145.14 35.0994L133.658 56.4376C132.948 57.7576 132.99 59.3551 133.769 60.6359L143.915 77.3199C144.668 78.5573 144.734 80.0938 144.091 81.3916L132.63 104.53C131.239 107.338 133.282 110.631 136.417 110.631H148.653Z" fill="#E05FBC"></path>
                <mask id="mask1_1078_116898" maskUnits="userSpaceOnUse" x="132" y="32" width="30" height="79" style={{ maskType: 'alpha' }}>
                  <path fillRule="evenodd" clipRule="evenodd" d="M161.306 32.876C159.748 32.8761 158.317 33.7326 157.582 35.1049L146.085 56.5453C145.382 57.8574 145.42 59.4429 146.187 60.719L156.866 78.4885C157.603 79.7157 157.669 81.233 157.041 82.5196L146.283 104.551C144.912 107.359 146.956 110.632 150.08 110.632H136.593C133.415 110.632 131.374 107.256 132.851 104.442L144.404 82.4278C145.087 81.1251 145.044 79.5608 144.29 78.2977L133.737 60.6226C132.975 59.3459 132.94 57.7627 133.645 56.4534L145.138 35.0991C145.875 33.7299 147.304 32.876 148.859 32.876L161.306 32.876Z" fill="#B78900"></path>
                </mask>
                <g mask="url(#mask1_1078_116898)">
                  <rect x="127.053" y="30.6768" width="39.802" height="11.4608" fill="url(#paint3_linear_1078_116898)"></rect>
                  <rect x="127.053" y="56.9751" width="39.802" height="25.184" fill="#FF6BD5"></rect>
                  <rect x="127.053" y="81.1445" width="39.802" height="31.6041" fill="url(#paint4_linear_1078_116898)"></rect>
                  <rect x="127.053" y="81.1445" width="39.802" height="12.7707" fill="#BF51A0"></rect>
                </g>
                <mask id="mask3_1078_116898" maskUnits="userSpaceOnUse" x="14" y="29" width="174" height="82" style={{ maskType: 'alpha' }}>
                  <path d="M174.822 83.279L180.309 94.511L113.445 110.532H14.6875V30.01L157.813 29.6465L179.387 43.5496L184.031 51.6602L186.732 56.6077C187.421 57.8685 187.37 59.4035 186.601 60.6164L175.072 78.7903C174.214 80.1416 174.12 81.8411 174.822 83.279Z" fill="#D9D9D9"></path>
                </mask>
                <g mask="url(#mask3_1078_116898)">
                  <g clipPath="url(#clip1_1078_116898)">
                    <path fillRule="evenodd" clipRule="evenodd" d="M87.3489 85.3906H69.8538L61.1067 70.2402L69.8538 55.0889H87.3489L94.0139 66.6336H131.675L136.182 80.4922L138.537 87.7358H138.538L138.541 87.7446L138.557 87.7358H159.512L155.11 74.0871L152.789 66.6336H159.425L160.14 68.8494L166.23 87.7358H177.104C181.994 87.7358 185.537 83.0735 184.227 78.362L178.405 57.412C177.636 54.6449 175.116 52.73 172.244 52.73H111.416L103.755 39.4609C101.542 35.628 97.5111 33.2201 93.1077 33.0732L92.68 33.0664L64.5227 33.0664C59.9541 33.0666 55.7329 35.5044 53.4485 39.4609L39.3694 63.8457C37.0853 67.8024 37.0851 72.6772 39.3694 76.6338L53.4485 101.019C55.7329 104.975 59.9542 107.412 64.5228 107.412L92.68 107.412L93.1077 107.405C97.511 107.258 101.542 104.851 103.755 101.019L111.424 87.7358H131.687L126.906 73.0282H94.4864L87.3489 85.3906Z" fill="#456DFF"></path>
                    <mask id="mask4_1078_116898" maskUnits="userSpaceOnUse" x="37" y="33" width="148" height="75" style={{ maskType: 'alpha' }}>
                      <path fillRule="evenodd" clipRule="evenodd" d="M87.3489 85.3901H69.8538L61.1067 70.2397L69.8538 55.0884H87.3489L94.0139 66.6331H131.675L136.182 80.4917L138.537 87.7353H138.538L138.541 87.7441L138.557 87.7353H159.512L155.11 74.0866L152.789 66.6331H159.425L160.14 68.849L166.23 87.7353H177.104C181.994 87.7353 185.537 83.0731 184.227 78.3615L178.405 57.4115C177.636 54.6444 175.116 52.7295 172.244 52.7295H111.416L103.755 39.4604C101.542 35.6275 97.5111 33.2196 93.1077 33.0728L92.68 33.0659L64.5227 33.0659C59.9541 33.0661 55.7329 35.5039 53.4485 39.4605L39.3694 63.8452C37.0853 67.8019 37.0851 72.6767 39.3694 76.6333L53.4485 101.018C55.7329 104.974 59.9542 107.411 64.5228 107.412L92.68 107.412L93.1077 107.405C97.511 107.258 101.542 104.851 103.755 101.018L111.424 87.7353H131.687L126.906 73.0277H94.4864L87.3489 85.3901Z" fill="#F7C325"></path>
                    </mask>
                    <g mask="url(#mask4_1078_116898)">
                      <rect x="41.8672" y="24.311" width="45.9659" height="17.5447" fill="#7491FF"></rect>
                      <rect x="33.959" y="70.2891" width="45.9659" height="10.7454" fill="#FF90E0"></rect>
                    </g>
                    <path fillRule="evenodd" clipRule="evenodd" d="M97.4798 85.3901H79.9847L71.2376 70.2397L79.9847 55.0884H97.4798L104.145 66.6334H141.802L148.669 87.7441L148.684 87.7353H169.643L165.154 73.8169L162.917 66.6334H169.556L170.27 68.8492L176.361 87.7353H187.234C192.125 87.7353 195.668 83.0731 194.358 78.3615L188.536 57.4115C187.767 54.6444 185.247 52.7295 182.375 52.7295H121.547L113.886 39.4604C111.673 35.6275 107.642 33.2196 103.239 33.0728L102.811 33.0659L74.6536 33.0659C70.0849 33.0661 65.8637 35.5039 63.5794 39.4605L49.5003 63.8452C47.2161 67.8019 47.216 72.6767 49.5003 76.6333L63.5794 101.018C65.8638 104.974 70.0851 107.411 74.6536 107.412L102.811 107.412L103.239 107.405C107.642 107.258 111.673 104.851 113.886 101.018L121.555 87.7353H141.818L137.037 73.028H104.617L97.4798 85.3901Z" fill="url(#paint11_linear_1078_116898)"></path>
                  </g>
                  <path d="M78.5449 34.6914H106.492C110.385 34.6914 113.974 36.7939 115.877 40.1893L123.78 54.2843H169.065" stroke="#DAE2FF" strokeWidth="3.0742"></path>
                  <path d="M151.334 54.2843H123.774L115.804 40.0681C113.942 36.7475 110.432 34.6914 106.625 34.6914V34.6914H94.1875" stroke="#FEF9E9" strokeWidth="3.0742"></path>
                </g>
                <path d="M71.5253 6.6167L72.9447 12.2655L78.5936 13.685L72.9447 15.1044L71.5253 20.7532L70.1059 15.1044L64.457 13.685L70.1059 12.2655L71.5253 6.6167Z" fill="url(#paint16_linear_1078_116898)"></path>
                <defs>
                  <linearGradient id="paint0_linear_1078_116898" x1="94.9248" y1="72.7258" x2="145.192" y2="72.7258" gradientUnits="userSpaceOnUse"><stop stopOpacity="0"></stop><stop offset="1"></stop></linearGradient>
                  <linearGradient id="paint1_linear_1078_116898" x1="90.166" y1="72.7258" x2="182.802" y2="72.7258" gradientUnits="userSpaceOnUse"><stop stopColor="#9D62FF" stopOpacity="0"></stop><stop offset="0.68" stopColor="#9D62FF"></stop><stop offset="1" stopColor="#9D62FF"></stop></linearGradient>
                  <linearGradient id="paint2_linear_1078_116898" x1="161.623" y1="71.7572" x2="182.343" y2="78.2731" gradientUnits="userSpaceOnUse"><stop stopColor="#381D66"></stop><stop offset="1" stopColor="#170B29"></stop></linearGradient>
                  <linearGradient id="paint3_linear_1078_116898" x1="149.251" y1="39.283" x2="149.251" y2="32.418" gradientUnits="userSpaceOnUse"><stop stopColor="#9E2E9E"></stop><stop offset="1" stopColor="#5A2EA3"></stop></linearGradient>
                  <linearGradient id="paint4_linear_1078_116898" x1="155.169" y1="96.9466" x2="155.406" y2="110.774" gradientUnits="userSpaceOnUse"><stop stopColor="#9E2E9E"></stop><stop offset="1" stopColor="#5A2EA3"></stop></linearGradient>
                  <linearGradient id="paint11_linear_1078_116898" x1="117.929" y1="36.2272" x2="40.8792" y2="162.783" gradientUnits="userSpaceOnUse"><stop stopColor="#ABBDFF"></stop><stop offset="0.33" stopColor="#F7C325"></stop><stop offset="0.670599" stopColor="#E350E3"></stop></linearGradient>
                  <linearGradient id="paint16_linear_1078_116898" x1="78.055" y1="6.16179" x2="63.9876" y2="10.2501" gradientUnits="userSpaceOnUse"><stop stopColor="white"></stop><stop offset="0.206264" stopColor="#456DFF"></stop><stop offset="0.525" stopColor="#D2B7FF"></stop><stop offset="0.725502" stopColor="#F7C325"></stop><stop offset="1" stopColor="white"></stop></linearGradient>
                  <clipPath id="clip0_1078_116898"><rect width="99.3098" height="127.201" fill="white" transform="translate(93.8457 9.02637)"></rect></clipPath>
                  <clipPath id="clip1_1078_116898"><rect width="156.973" height="156.973" fill="white" transform="translate(37.6562 -8.23096)"></rect></clipPath>
                </defs>
              </g>
            </svg>

            <h1 style={{
              fontSize: '50px',
              fontWeight: 500,
              letterSpacing: '-0.5px',
              lineHeight: '110%',
              textAlign: 'center',
              marginBottom: '16px',
              maxWidth: '784px',
              color: '#1a1a1a',
              fontFamily: 'coFoRobertFont, Georgia, serif',
            }}>Unlock the full Brilliant experience</h1>
            <p style={{
              textAlign: 'center',
              fontSize: '18px',
              color: '#1a1a1a',
              marginBottom: '32px'
            }}>Premium gives you unlimited learning, personalized tutoring, and more.</p>

            <div style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'center',
              gap: '20px',
              width: '100%',
              maxWidth: '990px',
              padding: '0 24px',
              paddingBottom: '32px'
            }}>
              
              {/* Monthly Plan */}
              <div style={{
                position: 'relative',
                flex: 1,
                padding: '4px',
                borderRadius: '20px',
                background: 'rgba(0,0,0,0.06)',
                cursor: 'pointer',
              }}>
                <div style={{
                  background: '#fff',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '120px',
                  padding: '12px 16px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
                }}>
                  <p style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#1a1a1a' }}>Monthly</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '16px', color: '#1a1a1a' }}>NGN 16,500</span>
                    <span style={{ fontSize: '16px', color: '#666' }}>/month</span>
                  </div>
                </div>
              </div>

              {/* Annual Plan (Most Popular) */}
              <div style={{ position: 'relative', flex: 1 }}>
                <div style={{
                  position: 'absolute',
                  top: '-25px',
                  left: 0,
                  right: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  zIndex: 10
                }}>
                  <img src="/mascot.png" alt="Lumii" width="50" height="50" style={{ transform: 'translateY(-6px)' }} />
                </div>
                <div style={{
                  position: 'relative',
                  width: '100%',
                  padding: '24px 4px 4px 4px',
                  borderRadius: '20px',
                  background: 'linear-gradient(86deg, #7491FF -7.44%, #FF90E0 44.8%, #F7C325 102.54%)',
                  cursor: 'pointer',
                  zIndex: 11
                }}>
                <p style={{
                  position: 'absolute',
                  top: '4px',
                  left: '0',
                  right: '0',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#1a1a1a', // standard text color
                  margin: 0
                }}>Most Popular</p>
                <div style={{
                  background: '#fff',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '120px',
                  padding: '12px 16px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
                }}>
                  <p style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#1a1a1a' }}>Annual</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '16px', color: '#1a1a1a' }}>NGN 11,000</span>
                    <span style={{ fontSize: '16px', color: '#666' }}>/month*</span>
                  </div>
                </div>
              </div>
              </div>

              {/* Family Plan */}
              <div style={{
                position: 'relative',
                flex: 1,
                padding: '4px',
                borderRadius: '20px',
                background: 'rgba(0,0,0,0.06)',
                cursor: 'pointer',
              }}>
                <div style={{
                  background: '#fff',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '120px',
                  padding: '12px 16px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
                }}>
                  <p style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#1a1a1a' }}>Family</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '16px', color: '#1a1a1a' }}>NGN 22,000</span>
                    <span style={{ fontSize: '16px', color: '#666' }}>/month</span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#666', marginTop: '4px', margin: '4px 0 0 0' }}>6 seats included</p>
                </div>
              </div>

            </div>

            <p style={{
              textAlign: 'center',
              fontSize: '13px',
              color: '#666',
              maxWidth: '690px',
              padding: '16px',
              marginBottom: '100px'
            }}>
              *Billed as one payment. Renews annually, cancel anytime. You can turn off auto-renew from your settings.
            </p>
          </div>

          {/* Sticky Footer */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            background: '#fff',
            padding: '20px',
            display: 'flex',
            justifyContent: 'center',
            boxShadow: '0 -4px 10px rgba(0,0,0,0.02)'
          }}>
            <button
              className="btn3d"
              onClick={() => setIsPlansOpen(false)}
              style={{
                display: 'inline-flex',
                position: 'relative',
                borderRadius: '9999px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                outline: 'none',
                padding: 0,
                width: '100%',
                maxWidth: '358px',
                WebkitTapHighlightColor: 'transparent',
              }}
              onMouseDown={e => {
                const face = e.currentTarget.querySelector('[data-face]');
                face.style.transform = 'none';
                face.style.boxShadow = 'none';
              }}
              onMouseUp={e => {
                const face = e.currentTarget.querySelector('[data-face]');
                face.style.transform = 'translateY(-4px)';
                face.style.boxShadow = '0 4px 0 0 #000';
              }}
              onMouseLeave={e => {
                const face = e.currentTarget.querySelector('[data-face]');
                face.style.transform = 'translateY(-4px)';
                face.style.boxShadow = '0 4px 0 0 #000';
              }}
            >
              <span
                data-face
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  padding: '14px 32px',
                  borderRadius: '9999px',
                  background: '#2A2A2A',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '16px',
                  fontFamily: 'Outfit, sans-serif',
                  position: 'relative',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 4px 0 0 #000',
                  transition: 'transform 0.1s ease-out, box-shadow 0.1s ease-out',
                }}
              >
                Subscribe now
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComponentPage;
