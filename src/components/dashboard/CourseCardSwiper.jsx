import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCreative } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/effect-creative';

// Mock Data
const courses = [
  {
    id: 1,
    title: "Fractions",
    level: "Level 1",
    levelColor: "#456DFF",
    badge: null,
    image: "https://ds055uzetaobb.cloudfront.net/chapter/Arithmetic_Thinking-KaQBTB.png",
    items: [
      {
        title: "Warm Up",
        active: true,
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="64px" height="62px" viewBox="0 0 64 62" fill="none" className="panda-flex-sh_0"><path d="M48.017 50.466c-8.982 5.272-23.545 5.272-32.526 0-8.983-5.272-8.983-13.82 0-19.092 8.982-5.272 23.544-5.272 32.526 0s8.982 13.82 0 19.092" fill="#CCC"></path><path d="M48.017 50.466c-8.982 5.272-23.545 5.272-32.526 0-8.983-5.272-8.983-13.82 0-19.092 8.982-5.272 23.544-5.272 32.526 0s8.982 13.82 0 19.092" fill="url(#:r8f:-a)"></path><path d="M18.669 45.698c7.224 4.296 18.938 4.296 26.162 0s7.225-11.26 0-15.556-18.938-4.296-26.162 0-7.225 11.26 0 15.556" fill="url(#:r8f:-b)"></path><g opacity=".5" filter="url(#:r8f:-c)"><path d="M23.515 42.243c4.686 2.343 12.284 2.343 16.97 0 4.687-2.343 4.687-6.143 0-8.486-4.686-2.343-12.284-2.343-16.97 0-4.687 2.343-4.687 6.143 0 8.486" fill="#000"></path></g><path d="M54.627 27.507c-12.497-7.81-32.757-7.81-45.254 0s-12.497 20.473 0 28.284c12.497 7.81 32.757 7.81 45.254 0s12.497-20.474 0-28.284m-42.476 1.875c10.962-6.583 28.736-6.583 39.698 0s10.962 17.256 0 23.839-28.736 6.583-39.698 0-10.961-17.256 0-23.84" fill="url(#:r8f:-d)"></path><path fillRule="evenodd" clipRule="evenodd" d="M33.923 9.26v-.002c-.98-2.752-3.248-3.613-4.503-3.875-2.921-.61-6.29-2.31-8.351-4.053-.773-.653-2.887-1.868-5.663-.882-2.775.986-3.65 3.263-3.838 4.256-.5 2.653-2.042 6.097-3.924 8.413-.809.993-2.026 3.093-1.05 5.845v.002l.001.002c.979 2.752 3.248 3.613 4.502 3.875 2.921.61 6.29 2.31 8.352 4.053.773.653 2.887 1.868 5.662.882s3.65-3.262 3.838-4.256c.5-2.652 2.042-6.097 3.925-8.413.808-.994 2.025-3.094 1.049-5.847" fill="#29CC57"></path><path fillRule="evenodd" clipRule="evenodd" d="M33.923 9.26v-.002c-.98-2.752-3.248-3.613-4.503-3.875-2.921-.61-6.29-2.31-8.351-4.053-.773-.653-2.887-1.868-5.663-.882-2.775.986-3.65 3.263-3.838 4.256-.5 2.653-2.042 6.097-3.924 8.413-.809.993-2.026 3.093-1.05 5.845v.002l.001.002c.979 2.752 3.248 3.613 4.502 3.875 2.921.61 6.29 2.31 8.352 4.053.773.653 2.887 1.868 5.662.882s3.65-3.262 3.838-4.256c.5-2.652 2.042-6.097 3.925-8.413.808-.994 2.025-3.094 1.049-5.847" fill="url(#:r8f:-e)" fillOpacity=".6"></path><path d="M23.673 8.21a4.25 4.25 0 0 0-5.43-2.584L14.829 6.84a4.25 4.25 0 0 0-2.584 5.43l1.537 4.327 11.428-4.059z" fill="#fff"></path><path d="m17.828 15.156 4.969-1.764-1.508-4.246-4.969 1.764z" fill="#000"></path><path d="m17.828 15.156 4.969-1.764-1.508-4.246-4.969 1.764z" fill="url(#:r8f:-f)"></path><g clipPath="url(#:r8f:-g)"><g clipPath="url(#:r8f:-h)"><path d="M33.811 9.122c1.823-1.823 5.886-.716 9.074 2.472s4.294 7.25 2.472 9.072l-.016.015-3.612 3.612-3.015-3.015.728-.728a13.1 13.1 0 0 1-3.157-2.356c-1-.999-1.794-2.084-2.359-3.159l-.727.727-3.015-3.015z" fill="#D9D9D9"></path><path d="M33.811 9.122c1.823-1.823 5.886-.716 9.074 2.472s4.294 7.25 2.472 9.072l-.016.015-3.612 3.612-3.015-3.015.728-.728a13.1 13.1 0 0 1-3.157-2.356c-1-.999-1.794-2.084-2.359-3.159l-.727.727-3.015-3.015z" fill="#B3B3B3"></path><path d="M33.811 9.122c1.823-1.823 5.886-.716 9.074 2.472s4.294 7.25 2.472 9.072l-.016.015-3.612 3.612-3.015-3.015.728-.728a13.1 13.1 0 0 1-3.157-2.356c-1-.999-1.794-2.084-2.359-3.159l-.727.727-3.015-3.015z" fill="url(#:r8f:-i)" fillOpacity=".7"></path><ellipse cx="35.951" cy="18.517" rx="4.667" ry="8.163" transform="rotate(-45 35.951 18.517)" fill="#4C4C4C"></ellipse><ellipse cx="35.951" cy="18.519" rx="4.667" ry="8.163" transform="rotate(-45 35.951 18.52)" fill="#5B5B5B"></ellipse><path d="M34.043 16.755c.57-.57 1.84-.224 2.837.773.996.997 1.343 2.267.773 2.837l.005.005-7.966 7.965-3.613-3.613 7.95-7.95z" fill="#CCC"></path><path d="M34.043 16.755c.57-.57 1.84-.224 2.837.773.996.997 1.343 2.267.773 2.837l.005.005-7.966 7.965-3.613-3.613 7.95-7.95z" fill="url(#:r8f:-j)" fillOpacity=".7"></path><path d="m22.342 20.59.178-.162c1.898-1.588 5.806-.453 8.895 2.635 3.188 3.188 4.295 7.25 2.472 9.073q-.055.054-.113.103l-3.518 3.519-3.015-3.015.726-.726c-1.073-.564-2.156-1.357-3.153-2.354-.999-.999-1.793-2.084-2.357-3.158l-.727.727-3.015-3.015z" fill="#B3B3B3"></path><path d="m22.342 20.59.178-.162c1.898-1.588 5.806-.453 8.895 2.635 3.188 3.188 4.295 7.25 2.472 9.073q-.055.054-.113.103l-3.518 3.519-3.015-3.015.726-.726c-1.073-.564-2.156-1.357-3.153-2.354-.999-.999-1.793-2.084-2.357-3.158l-.727.727-3.015-3.015z" fill="url(#:r8f:-k)" fillOpacity=".7"></path><ellipse cx="24.486" cy="29.988" rx="4.667" ry="8.163" transform="rotate(-45 24.486 29.988)" fill="#4C4C4C"></ellipse><ellipse cx="24.486" cy="29.988" rx="4.667" ry="8.163" transform="rotate(-45 24.486 29.988)" fill="#5B5B5B"></ellipse><path d="M22.703 28.106c.57-.57 1.84-.224 2.837.773.996.997 1.342 2.265.773 2.835l.001.002-1.281 1.282-3.61-3.61 1.273-1.274z" fill="#B3B3B3"></path><path d="M22.703 28.106c.57-.57 1.84-.224 2.837.773.996.997 1.342 2.265.773 2.835l.001.002-1.281 1.282-3.61-3.61 1.273-1.274z" fill="url(#:r8f:-l)" fillOpacity=".7"></path><ellipse cx="23.228" cy="31.191" rx="1.459" ry="2.553" transform="rotate(-45 23.228 31.191)" fill="#5B5B5B"></ellipse></g></g><defs><linearGradient id=":r8f:-a" x1="31.754" y1="54.42" x2="31.754" y2="27.42" gradientUnits="userSpaceOnUse"><stop stop-opacity=".6"></stop><stop offset="1" stop-opacity=".025"></stop></linearGradient><linearGradient id=":r8f:-b" x1="31.75" y1="48.92" x2="31.75" y2="26.92" gradientUnits="userSpaceOnUse"><stop stop-opacity=".025"></stop><stop offset="1" stop-opacity=".5"></stop></linearGradient><linearGradient id=":r8f:-d" x1="32" y1="61.648" x2="32" y2="21.648" gradientUnits="userSpaceOnUse"><stop stop-color="#456DFF"></stop><stop offset="1" stop-color="#456DFF" stop-opacity="0"></stop></linearGradient><linearGradient id=":r8f:-e" x1="17.978" y1="10.774" x2="23.824" y2="24.353" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" stop-opacity="0"></stop><stop offset="1" stop-color="#fff"></stop></linearGradient><linearGradient id=":r8f:-f" x1="17.677" y1="7.036" x2="20.122" y2="16.354" gradientUnits="userSpaceOnUse"><stop stop-opacity="0"></stop><stop offset=".745" stop-color="#666"></stop></linearGradient><linearGradient id=":r8f:-i" x1="30.043" y1="8.359" x2="71.839" y2="32.218" gradientUnits="userSpaceOnUse"><stop></stop><stop offset=".406" stop-color="#fff"></stop></linearGradient><linearGradient id=":r8f:-j" x1="28.128" y1="21.253" x2="39.848" y2="31.524" gradientUnits="userSpaceOnUse"><stop></stop><stop offset=".406" stop-color="#fff"></stop></linearGradient><linearGradient id=":r8f:-k" x1="18.574" y1="19.828" x2="60.37" y2="43.685" gradientUnits="userSpaceOnUse"><stop></stop><stop offset=".406" stop-color="#fff"></stop></linearGradient><linearGradient id=":r8f:-l" x1="21.423" y1="27.969" x2="34.427" y2="35.673" gradientUnits="userSpaceOnUse"><stop></stop><stop offset=".406" stop-color="#fff"></stop></linearGradient><clipPath id=":r8f:-g"><path fill="#fff" d="M17.363 8.084H46.86v29.497H17.363z"></path></clipPath><clipPath id=":r8f:-h"><path fill="#fff" d="M13.441 25.54 35.133 3.85l15.495 15.494-21.692 21.692z"></path></clipPath><filter id=":r8f:-c" x="15" y="27" width="34" height="22" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"></feFlood><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"></feBlend><feGaussianBlur stdDeviation="2.5" result="effect1_foregroundBlur_12199_1126199"></feGaussianBlur></filter></defs></svg>
        )
      },
      {
        title: "Combining Parts",
        active: false,
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="64px" height="62px" viewBox="0 0 64 62" fill="none" className="panda-flex-sh_0"><path d="M48.017 50.753c-8.982 5.33-23.545 5.33-32.527 0-8.982-5.329-8.982-13.97 0-19.299 8.983-5.33 23.545-5.33 32.527 0s8.982 13.97 0 19.3" fill="#CCC"></path><path d="M48.017 50.753c-8.982 5.33-23.545 5.33-32.527 0-8.982-5.329-8.982-13.97 0-19.299 8.983-5.33 23.545-5.33 32.527 0s8.982 13.97 0 19.3" fill="url(#:r8h:-a)"></path><path d="M18.669 45.933c7.224 4.343 18.938 4.343 26.162 0 7.225-4.342 7.225-11.382 0-15.725-7.224-4.342-18.938-4.342-26.162 0-7.225 4.343-7.225 11.383 0 15.725" fill="url(#:r8h:-b)"></path><path d="M32.61 31.443q.022 0 .042.002l.199.011.378.027.098.009a20 20 0 0 1 1.617.207l.334.06.154.03q.169.035.336.073a17 17 0 0 1 .65.155l.114.032q.201.055.398.112l.06.019q.189.057.373.118l.215.073a15 15 0 0 1 .695.264q.1.039.198.081.125.054.248.11l.177.08.053.025.343.169.04.021.155.084q.117.062.232.127l.2.12q.141.084.278.171c3.99 2.567 3.832 6.494-.478 8.952a12 12 0 0 1-1.08.54l-.132.059-.288.119-.158.062-.292.11-.117.043q-.178.063-.36.121l-.048.016q-.194.063-.393.12-.03.01-.063.018a17.7 17.7 0 0 1-3.198.605l-.029.003q-.222.022-.445.04-.028 0-.055.004-.225.016-.45.028v2.013c3.487-.133 6.909-.958 9.574-2.481 5.839-3.338 5.839-8.75 0-12.087-2.665-1.524-6.087-2.35-9.574-2.482zm-1.993-2.017c-3.487.132-6.909.958-9.574 2.482-5.838 3.337-5.838 8.75 0 12.087 2.665 1.523 6.087 2.348 9.574 2.48v-2.012c-2.593-.128-5.124-.757-7.108-1.888-4.476-2.552-4.476-6.691 0-9.243 1.984-1.132 4.515-1.761 7.108-1.89z" fill="#000" fillOpacity=".4"></path><path opacity=".5" d="M18.669 45.933c7.224 4.343 18.938 4.343 26.162 0 7.225-4.342 7.225-11.382 0-15.725-7.224-4.342-18.938-4.342-26.162 0-7.225 4.343-7.225 11.383 0 15.725" fill="url(#:r8h:-c)"></path><defs><linearGradient id=":r8h:-a" x1="31.754" y1="54.751" x2="31.754" y2="27.457" gradientUnits="userSpaceOnUse"><stop stop-opacity=".6"></stop><stop offset="1" stop-opacity=".025"></stop></linearGradient><linearGradient id=":r8h:-b" x1="31.75" y1="49.19" x2="31.75" y2="26.951" gradientUnits="userSpaceOnUse"><stop stop-opacity=".025"></stop><stop offset="1" stop-opacity=".5"></stop></linearGradient><linearGradient id=":r8h:-c" x1="31.75" y1="49.19" x2="31.75" y2="26.951" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" stop-opacity=".7"></stop><stop offset="1" stop-color="#fff" stop-opacity=".026"></stop></linearGradient></defs></svg>
        )
      },
    ]
  },
  {
    id: 2,
    title: "Algorithmic Thinking",
    level: "Level 1",
    levelColor: "#9D62FF",
    badge: null,
    image: "https://ds055uzetaobb.cloudfront.net/chapter/Algorithmic_Thinking-ZSOEgi.png",
    items: [
      {
        title: "The Scheduling Problem",
        active: true,
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="64px" height="62px" viewBox="0 0 64 62" fill="none" className="panda-flex-sh_0"><path d="M48.017 50.466c-8.982 5.272-23.545 5.272-32.527 0s-8.982-13.82 0-19.092c8.983-5.272 23.545-5.272 32.527 0s8.982 13.82 0 19.092" fill="#CCC"></path><path d="M48.017 50.466c-8.982 5.272-23.545 5.272-32.527 0s-8.982-13.82 0-19.092c8.983-5.272 23.545-5.272 32.527 0s8.982 13.82 0 19.092" fill="url(#:r8m:-a)"></path><path d="M18.669 45.698c7.224 4.296 18.938 4.296 26.162 0s7.225-11.26 0-15.556-18.938-4.296-26.162 0-7.225 11.26 0 15.556" fill="url(#:r8m:-b)"></path><g filter="url(#:r8m:-c)"><path d="M21.182 43.883c5.838 3.293 15.304 3.293 21.142 0 5.839-3.294 5.839-8.633 0-11.927-5.838-3.293-15.304-3.293-21.142 0s-5.838 8.634 0 11.927" fill="#fff"></path></g><path d="M21.182 43.883c5.838 3.293 15.304 3.293 21.142 0 5.839-3.294 5.839-8.633 0-11.927-5.838-3.293-15.304-3.293-21.142 0s-5.838 8.634 0 11.927" fill="#fff"></path><path d="M54.628 27.755c-12.497-7.674-32.758-7.673-45.255 0s-12.497 20.115 0 27.788 32.758 7.673 45.255 0 12.496-20.115 0-27.788M12.15 29.598c10.962-6.468 28.736-6.468 39.698 0 10.962 6.467 10.962 16.953 0 23.42s-28.736 6.468-39.698 0c-10.961-6.467-10.961-16.953 0-23.42" fill="url(#:r8m:-d)"></path><path fillRule="evenodd" clipRule="evenodd" d="M46.5 15.5c-.001-2.921-1.851-4.492-2.945-5.158-2.55-1.553-5.155-4.283-6.514-6.615C36.531 2.852 34.945 1 32 1s-4.531 1.853-5.041 2.726c-1.36 2.332-3.965 5.062-6.514 6.615-1.094.665-2.944 2.236-2.945 5.157v.003c.001 2.921 1.851 4.492 2.945 5.158 2.55 1.553 5.155 4.283 6.514 6.615C27.469 28.148 29.055 30 32 30s4.531-1.853 5.041-2.726c1.36-2.332 3.965-5.062 6.514-6.615 1.094-.666 2.944-2.237 2.945-5.158z" fill="#29CC57"></path><path fillRule="evenodd" clipRule="evenodd" d="M46.5 15.5c-.001-2.921-1.851-4.492-2.945-5.158-2.55-1.553-5.155-4.283-6.514-6.615C36.531 2.852 34.945 1 32 1s-4.531 1.853-5.041 2.726c-1.36 2.332-3.965 5.062-6.514 6.615-1.094.665-2.944 2.236-2.945 5.157v.003c.001 2.921 1.851 4.492 2.945 5.158 2.55 1.553 5.155 4.283 6.514 6.615C27.469 28.148 29.055 30 32 30s4.531-1.853 5.041-2.726c1.36-2.332 3.965-5.062 6.514-6.615 1.094-.666 2.944-2.237 2.945-5.158z" fill="url(#:r8m:-e)" fillOpacity=".6"></path><path d="M38.063 13.163A4.25 4.25 0 0 0 33.81 8.91h-3.622a4.25 4.25 0 0 0-4.253 4.252v6.82h12.128z" fill="#fff"></path><path d="M29.363 17.082h5.273v-5.273h-5.273z" fill="#000"></path><defs><linearGradient id=":r8m:-a" x1="31.754" y1="54.42" x2="31.754" y2="27.42" gradientUnits="userSpaceOnUse"><stop stop-opacity=".6"></stop><stop offset="1" stop-opacity=".025"></stop></linearGradient><linearGradient id=":r8m:-b" x1="31.75" y1="48.92" x2="31.75" y2="26.92" gradientUnits="userSpaceOnUse"><stop stop-opacity=".025"></stop><stop offset="1" stop-opacity=".5"></stop></linearGradient><linearGradient id=":r8m:-d" x1="32" y1="61.298" x2="32" y2="22" gradientUnits="userSpaceOnUse"><stop stop-color="#9D62FF"></stop><stop offset="1" stop-color="#9D62FF" stop-opacity="0"></stop></linearGradient><linearGradient id=":r8m:-e" x1="32" y1="15.5" x2="32" y2="30" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" stop-opacity="0"></stop><stop offset="1" stop-color="#fff"></stop></linearGradient><filter id=":r8m:-c" x="13.738" y="26.42" width="36.032" height="23" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"></feFlood><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"></feBlend><feGaussianBlur stdDeviation="1.533" result="effect1_foregroundBlur_12205_1133759"></feGaussianBlur></filter></defs></svg>
        )
      },
      {
        title: "Solving Instances",
        active: false,
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="64px" height="62px" viewBox="0 0 64 62" fill="none" className="panda-flex-sh_0"><path d="M48.017 50.753c-8.982 5.33-23.545 5.33-32.527 0-8.982-5.329-8.982-13.97 0-19.299 8.983-5.33 23.545-5.33 32.527 0s8.982 13.97 0 19.3" fill="#CCC"></path><path d="M48.017 50.753c-8.982 5.33-23.545 5.33-32.527 0-8.982-5.329-8.982-13.97 0-19.299 8.983-5.33 23.545-5.33 32.527 0s8.982 13.97 0 19.3" fill="url(#:r8o:-a)"></path><path d="M18.669 45.933c7.224 4.343 18.938 4.343 26.162 0 7.225-4.342 7.225-11.382 0-15.725-7.224-4.342-18.938-4.342-26.162 0-7.225 4.343-7.225 11.383 0 15.725" fill="url(#:r8o:-b)"></path><path d="M32.61 31.443q.022 0 .042.002l.199.011.378.027.098.009a20 20 0 0 1 1.617.207l.334.06.154.03q.169.035.336.073a17 17 0 0 1 .65.155l.114.032q.201.055.398.112l.06.019q.189.057.373.118l.215.073a15 15 0 0 1 .695.264q.1.039.198.081.125.054.248.11l.177.08.053.025.343.169.04.021.155.084q.117.062.232.127l.2.12q.141.084.278.171c3.99 2.567 3.832 6.494-.478 8.952a12 12 0 0 1-1.08.54l-.132.059-.288.119-.158.062-.292.11-.117.043q-.178.063-.36.121l-.048.016q-.194.063-.393.12-.03.01-.063.018a17.7 17.7 0 0 1-3.198.605l-.029.003q-.222.022-.445.04-.028 0-.055.004-.225.016-.45.028v2.013c3.487-.133 6.909-.958 9.574-2.481 5.839-3.338 5.839-8.75 0-12.087-2.665-1.524-6.087-2.35-9.574-2.482zm-1.993-2.017c-3.487.132-6.909.958-9.574 2.482-5.838 3.337-5.838 8.75 0 12.087 2.665 1.523 6.087 2.348 9.574 2.48v-2.012c-2.593-.128-5.124-.757-7.108-1.888-4.476-2.552-4.476-6.691 0-9.243 1.984-1.132 4.515-1.761 7.108-1.89z" fill="#000" fillOpacity=".4"></path><path opacity=".5" d="M18.669 45.933c7.224 4.343 18.938 4.343 26.162 0 7.225-4.342 7.225-11.382 0-15.725-7.224-4.342-18.938-4.342-26.162 0-7.225 4.343-7.225 11.383 0 15.725" fill="url(#:r8o:-c)"></path><defs><linearGradient id=":r8o:-a" x1="31.754" y1="54.751" x2="31.754" y2="27.457" gradientUnits="userSpaceOnUse"><stop stop-opacity=".6"></stop><stop offset="1" stop-opacity=".025"></stop></linearGradient><linearGradient id=":r8o:-b" x1="31.75" y1="49.19" x2="31.75" y2="26.951" gradientUnits="userSpaceOnUse"><stop stop-opacity=".025"></stop><stop offset="1" stop-opacity=".5"></stop></linearGradient><linearGradient id=":r8o:-c" x1="31.75" y1="49.19" x2="31.75" y2="26.951" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" stop-opacity=".7"></stop><stop offset="1" stop-color="#fff" stop-opacity=".026"></stop></linearGradient></defs></svg>
        )
      },
    ]
  },
  {
    id: 3,
    title: "Programming with Functions",
    level: "Level 1",
    levelColor: "#9D62FF",
    badge: null,
    image: "https://ds055uzetaobb.cloudfront.net/chapter/Programming_with_Functions-NL91vb.png",
    items: [
      {
        title: "Filtering Images",
        active: true,
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="64px" height="62px" viewBox="0 0 64 62" fill="none" className="panda-flex-sh_0"><path d="M48.017 50.466c-8.982 5.272-23.545 5.272-32.527 0s-8.982-13.82 0-19.092c8.983-5.272 23.545-5.272 32.527 0s8.982 13.82 0 19.092" fill="#CCC"></path><path d="M48.017 50.466c-8.982 5.272-23.545 5.272-32.527 0s-8.982-13.82 0-19.092c8.983-5.272 23.545-5.272 32.527 0s8.982 13.82 0 19.092" fill="url(#:r8t:-a)"></path><path d="M18.669 45.698c7.224 4.296 18.938 4.296 26.162 0s7.225-11.26 0-15.556-18.938-4.296-26.162 0-7.225 11.26 0 15.556" fill="url(#:r8t:-b)"></path><g filter="url(#:r8t:-c)"><path d="M21.182 43.883c5.838 3.293 15.304 3.293 21.142 0 5.839-3.294 5.839-8.633 0-11.927-5.838-3.293-15.304-3.293-21.142 0s-5.838 8.634 0 11.927" fill="#fff"></path></g><path d="M21.182 43.883c5.838 3.293 15.304 3.293 21.142 0 5.839-3.294 5.839-8.633 0-11.927-5.838-3.293-15.304-3.293-21.142 0s-5.838 8.634 0 11.927" fill="#fff"></path><path d="M54.628 27.755c-12.497-7.674-32.758-7.673-45.255 0s-12.497 20.115 0 27.788 32.758 7.673 45.255 0 12.496-20.115 0-27.788M12.15 29.598c10.962-6.468 28.736-6.468 39.698 0 10.962 6.467 10.962 16.953 0 23.42s-28.736 6.468-39.698 0c-10.961-6.467-10.961-16.953 0-23.42" fill="url(#:r8t:-d)"></path><path fillRule="evenodd" clipRule="evenodd" d="M46.5 15.5c-.001-2.921-1.851-4.492-2.945-5.158-2.55-1.553-5.155-4.283-6.514-6.615C36.531 2.852 34.945 1 32 1s-4.531 1.853-5.041 2.726c-1.36 2.332-3.965 5.062-6.514 6.615-1.094.665-2.944 2.236-2.945 5.157v.003c.001 2.921 1.851 4.492 2.945 5.158 2.55 1.553 5.155 4.283 6.514 6.615C27.469 28.148 29.055 30 32 30s4.531-1.853 5.041-2.726c1.36-2.332 3.965-5.062 6.514-6.615 1.094-.666 2.944-2.237 2.945-5.158z" fill="#29CC57"></path><path fillRule="evenodd" clipRule="evenodd" d="M46.5 15.5c-.001-2.921-1.851-4.492-2.945-5.158-2.55-1.553-5.155-4.283-6.514-6.615C36.531 2.852 34.945 1 32 1s-4.531 1.853-5.041 2.726c-1.36 2.332-3.965 5.062-6.514 6.615-1.094.665-2.944 2.236-2.945 5.157v.003c.001 2.921 1.851 4.492 2.945 5.158 2.55 1.553 5.155 4.283 6.514 6.615C27.469 28.148 29.055 30 32 30s4.531-1.853 5.041-2.726c1.36-2.332 3.965-5.062 6.514-6.615 1.094-.666 2.944-2.237 2.945-5.158z" fill="url(#:r8t:-e)" fillOpacity=".6"></path><path d="M38.063 13.163A4.25 4.25 0 0 0 33.81 8.91h-3.622a4.25 4.25 0 0 0-4.253 4.252v6.82h12.128z" fill="#fff"></path><path d="M29.363 17.082h5.273v-5.273h-5.273z" fill="#000"></path><defs><linearGradient id=":r8t:-a" x1="31.754" y1="54.42" x2="31.754" y2="27.42" gradientUnits="userSpaceOnUse"><stop stop-opacity=".6"></stop><stop offset="1" stop-opacity=".025"></stop></linearGradient><linearGradient id=":r8t:-b" x1="31.75" y1="48.92" x2="31.75" y2="26.92" gradientUnits="userSpaceOnUse"><stop stop-opacity=".025"></stop><stop offset="1" stop-opacity=".5"></stop></linearGradient><linearGradient id=":r8t:-d" x1="32" y1="61.298" x2="32" y2="22" gradientUnits="userSpaceOnUse"><stop stop-color="#9D62FF"></stop><stop offset="1" stop-color="#9D62FF" stop-opacity="0"></stop></linearGradient><linearGradient id=":r8t:-e" x1="32" y1="15.5" x2="32" y2="30" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" stop-opacity="0"></stop><stop offset="1" stop-color="#fff"></stop></linearGradient><filter id=":r8t:-c" x="13.738" y="26.42" width="36.032" height="23" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"></feFlood><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"></feBlend><feGaussianBlur stdDeviation="1.533" result="effect1_foregroundBlur_12205_1133759"></feGaussianBlur></filter></defs></svg>
        )
      },
      {
        title: "Adjusting Images",
        active: false,
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="64px" height="62px" viewBox="0 0 64 62" fill="none" className="panda-flex-sh_0"><path d="M48.017 50.753c-8.982 5.33-23.545 5.33-32.527 0-8.982-5.329-8.982-13.97 0-19.299 8.983-5.33 23.545-5.33 32.527 0s8.982 13.97 0 19.3" fill="#CCC"></path><path d="M48.017 50.753c-8.982 5.33-23.545 5.33-32.527 0-8.982-5.329-8.982-13.97 0-19.299 8.983-5.33 23.545-5.33 32.527 0s8.982 13.97 0 19.3" fill="url(#:r8v:-a)"></path><path d="M18.669 45.933c7.224 4.343 18.938 4.343 26.162 0 7.225-4.342 7.225-11.382 0-15.725-7.224-4.342-18.938-4.342-26.162 0-7.225 4.343-7.225 11.383 0 15.725" fill="url(#:r8v:-b)"></path><path d="M32.61 31.443q.022 0 .042.002l.199.011.378.027.098.009a20 20 0 0 1 1.617.207l.334.06.154.03q.169.035.336.073a17 17 0 0 1 .65.155l.114.032q.201.055.398.112l.06.019q.189.057.373.118l.215.073a15 15 0 0 1 .695.264q.1.039.198.081.125.054.248.11l.177.08.053.025.343.169.04.021.155.084q.117.062.232.127l.2.12q.141.084.278.171c3.99 2.567 3.832 6.494-.478 8.952a12 12 0 0 1-1.08.54l-.132.059-.288.119-.158.062-.292.11-.117.043q-.178.063-.36.121l-.048.016q-.194.063-.393.12-.03.01-.063.018a17.7 17.7 0 0 1-3.198.605l-.029.003q-.222.022-.445.04-.028 0-.055.004-.225.016-.45.028v2.013c3.487-.133 6.909-.958 9.574-2.481 5.839-3.338 5.839-8.75 0-12.087-2.665-1.524-6.087-2.35-9.574-2.482zm-1.993-2.017c-3.487.132-6.909.958-9.574 2.482-5.838 3.337-5.838 8.75 0 12.087 2.665 1.523 6.087 2.348 9.574 2.48v-2.012c-2.593-.128-5.124-.757-7.108-1.888-4.476-2.552-4.476-6.691 0-9.243 1.984-1.132 4.515-1.761 7.108-1.89z" fill="#000" fillOpacity=".4"></path><path opacity=".5" d="M18.669 45.933c7.224 4.343 18.938 4.343 26.162 0 7.225-4.342 7.225-11.382 0-15.725-7.224-4.342-18.938-4.342-26.162 0-7.225 4.343-7.225 11.383 0 15.725" fill="url(#:r8v:-c)"></path><defs><linearGradient id=":r8v:-a" x1="31.754" y1="54.751" x2="31.754" y2="27.457" gradientUnits="userSpaceOnUse"><stop stop-opacity=".6"></stop><stop offset="1" stop-opacity=".025"></stop></linearGradient><linearGradient id=":r8v:-b" x1="31.75" y1="49.19" x2="31.75" y2="26.951" gradientUnits="userSpaceOnUse"><stop stop-opacity=".025"></stop><stop offset="1" stop-opacity=".5"></stop></linearGradient><linearGradient id=":r8v:-c" x1="31.75" y1="49.19" x2="31.75" y2="26.951" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" stop-opacity=".7"></stop><stop offset="1" stop-color="#fff" stop-opacity=".026"></stop></linearGradient></defs></svg>
        )
      },
    ]
  },
  {
    id: 4,
    title: "Thinking in Code",
    level: "Level 1",
    levelColor: "#9D62FF",
    badge: "Recommended",
    image: "https://ds055uzetaobb.cloudfront.net/chapter/thinking-in-code-DolooX.png",
    items: [
      {
        title: "Writing Programs",
        active: true,
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="64px" height="62px" viewBox="0 0 64 62" fill="none" className="panda-flex-sh_0"><path d="M48.017 50.466c-8.982 5.272-23.545 5.272-32.527 0s-8.982-13.82 0-19.092c8.983-5.272 23.545-5.272 32.527 0s8.982 13.82 0 19.092" fill="#CCC"></path><path d="M48.017 50.466c-8.982 5.272-23.545 5.272-32.527 0s-8.982-13.82 0-19.092c8.983-5.272 23.545-5.272 32.527 0s8.982 13.82 0 19.092" fill="url(#:r94:-a)"></path><path d="M18.669 45.698c7.224 4.296 18.938 4.296 26.162 0s7.225-11.26 0-15.556-18.938-4.296-26.162 0-7.225 11.26 0 15.556" fill="url(#:r94:-b)"></path><g filter="url(#:r94:-c)"><path d="M21.182 43.883c5.838 3.293 15.304 3.293 21.142 0 5.839-3.294 5.839-8.633 0-11.927-5.838-3.293-15.304-3.293-21.142 0s-5.838 8.634 0 11.927" fill="#fff"></path></g><path d="M21.182 43.883c5.838 3.293 15.304 3.293 21.142 0 5.839-3.294 5.839-8.633 0-11.927-5.838-3.293-15.304-3.293-21.142 0s-5.838 8.634 0 11.927" fill="#fff"></path><path d="M54.628 27.755c-12.497-7.674-32.758-7.673-45.255 0s-12.497 20.115 0 27.788 32.758 7.673 45.255 0 12.496-20.115 0-27.788M12.15 29.598c10.962-6.468 28.736-6.468 39.698 0 10.962 6.467 10.962 16.953 0 23.42s-28.736 6.468-39.698 0c-10.961-6.467-10.961-16.953 0-23.42" fill="url(#:r94:-d)"></path><path fillRule="evenodd" clipRule="evenodd" d="M46.5 15.5c-.001-2.921-1.851-4.492-2.945-5.158-2.55-1.553-5.155-4.283-6.514-6.615C36.531 2.852 34.945 1 32 1s-4.531 1.853-5.041 2.726c-1.36 2.332-3.965 5.062-6.514 6.615-1.094.665-2.944 2.236-2.945 5.157v.003c.001 2.921 1.851 4.492 2.945 5.158 2.55 1.553 5.155 4.283 6.514 6.615C27.469 28.148 29.055 30 32 30s4.531-1.853 5.041-2.726c1.36-2.332 3.965-5.062 6.514-6.615 1.094-.666 2.944-2.237 2.945-5.158z" fill="#29CC57"></path><path fillRule="evenodd" clipRule="evenodd" d="M46.5 15.5c-.001-2.921-1.851-4.492-2.945-5.158-2.55-1.553-5.155-4.283-6.514-6.615C36.531 2.852 34.945 1 32 1s-4.531 1.853-5.041 2.726c-1.36 2.332-3.965 5.062-6.514 6.615-1.094.665-2.944 2.236-2.945 5.157v.003c.001 2.921 1.851 4.492 2.945 5.158 2.55 1.553 5.155 4.283 6.514 6.615C27.469 28.148 29.055 30 32 30s4.531-1.853 5.041-2.726c1.36-2.332 3.965-5.062 6.514-6.615 1.094-.666 2.944-2.237 2.945-5.158z" fill="url(#:r94:-e)" fillOpacity=".6"></path><path d="M38.063 13.163A4.25 4.25 0 0 0 33.81 8.91h-3.622a4.25 4.25 0 0 0-4.253 4.252v6.82h12.128z" fill="#fff"></path><path d="M29.363 17.082h5.273v-5.273h-5.273z" fill="#000"></path><defs><linearGradient id=":r94:-a" x1="31.754" y1="54.42" x2="31.754" y2="27.42" gradientUnits="userSpaceOnUse"><stop stop-opacity=".6"></stop><stop offset="1" stop-opacity=".025"></stop></linearGradient><linearGradient id=":r94:-b" x1="31.75" y1="48.92" x2="31.75" y2="26.92" gradientUnits="userSpaceOnUse"><stop stop-opacity=".025"></stop><stop offset="1" stop-opacity=".5"></stop></linearGradient><linearGradient id=":r94:-d" x1="32" y1="61.298" x2="32" y2="22" gradientUnits="userSpaceOnUse"><stop stop-color="#9D62FF"></stop><stop offset="1" stop-color="#9D62FF" stop-opacity="0"></stop></linearGradient><linearGradient id=":r94:-e" x1="32" y1="15.5" x2="32" y2="30" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" stop-opacity="0"></stop><stop offset="1" stop-color="#fff"></stop></linearGradient><filter id=":r94:-c" x="13.738" y="26.42" width="36.032" height="23" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"></feFlood><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"></feBlend><feGaussianBlur stdDeviation="1.533" result="effect1_foregroundBlur_12205_1133759"></feGaussianBlur></filter></defs></svg>
        )
      },
      {
        title: "Sequencing Commands",
        active: false,
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="64px" height="62px" viewBox="0 0 64 62" fill="none" className="panda-flex-sh_0"><path d="M48.017 50.753c-8.982 5.33-23.545 5.33-32.527 0-8.982-5.329-8.982-13.97 0-19.299 8.983-5.33 23.545-5.33 32.527 0s8.982 13.97 0 19.3" fill="#CCC"></path><path d="M48.017 50.753c-8.982 5.33-23.545 5.33-32.527 0-8.982-5.329-8.982-13.97 0-19.299 8.983-5.33 23.545-5.33 32.527 0s8.982 13.97 0 19.3" fill="url(#:r96:-a)"></path><path d="M18.669 45.933c7.224 4.343 18.938 4.343 26.162 0 7.225-4.342 7.225-11.382 0-15.725-7.224-4.342-18.938-4.342-26.162 0-7.225 4.343-7.225 11.383 0 15.725" fill="url(#:r96:-b)"></path><path d="M32.61 31.443q.022 0 .042.002l.199.011.378.027.098.009a20 20 0 0 1 1.617.207l.334.06.154.03q.169.035.336.073a17 17 0 0 1 .65.155l.114.032q.201.055.398.112l.06.019q.189.057.373.118l.215.073a15 15 0 0 1 .695.264q.1.039.198.081.125.054.248.11l.177.08.053.025.343.169.04.021.155.084q.117.062.232.127l.2.12q.141.084.278.171c3.99 2.567 3.832 6.494-.478 8.952a12 12 0 0 1-1.08.54l-.132.059-.288.119-.158.062-.292.11-.117.043q-.178.063-.36.121l-.048.016q-.194.063-.393.12-.03.01-.063.018a17.7 17.7 0 0 1-3.198.605l-.029.003q-.222.022-.445.04-.028 0-.055.004-.225.016-.45.028v2.013c3.487-.133 6.909-.958 9.574-2.481 5.839-3.338 5.839-8.75 0-12.087-2.665-1.524-6.087-2.35-9.574-2.482zm-1.993-2.017c-3.487.132-6.909.958-9.574 2.482-5.838 3.337-5.838 8.75 0 12.087 2.665 1.523 6.087 2.348 9.574 2.48v-2.012c-2.593-.128-5.124-.757-7.108-1.888-4.476-2.552-4.476-6.691 0-9.243 1.984-1.132 4.515-1.761 7.108-1.89z" fill="#000" fillOpacity=".4"></path><path opacity=".5" d="M18.669 45.933c7.224 4.343 18.938 4.343 26.162 0 7.225-4.342 7.225-11.382 0-15.725-7.224-4.342-18.938-4.342-26.162 0-7.225 4.343-7.225 11.383 0 15.725" fill="url(#:r96:-c)"></path><defs><linearGradient id=":r96:-a" x1="31.754" y1="54.751" x2="31.754" y2="27.457" gradientUnits="userSpaceOnUse"><stop stop-opacity=".6"></stop><stop offset="1" stop-opacity=".025"></stop></linearGradient><linearGradient id=":r96:-b" x1="31.75" y1="49.19" x2="31.75" y2="26.951" gradientUnits="userSpaceOnUse"><stop stop-opacity=".025"></stop><stop offset="1" stop-opacity=".5"></stop></linearGradient><linearGradient id=":r96:-c" x1="31.75" y1="49.19" x2="31.75" y2="26.951" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" stop-opacity=".7"></stop><stop offset="1" stop-color="#fff" stop-opacity=".026"></stop></linearGradient></defs></svg>
        )
      },
    ]
  },
];


const CourseCardSwiper = ({ isDark = false }) => {
  return (
    <div style={{ width: '100%', maxWidth: '420px', margin: '0 auto', overflow: 'visible' }}>
      <Swiper
        effect={'creative'}
        grabCursor={true}
        modules={[EffectCreative]}
        className="mySwiper"
        creativeEffect={{
          prev: {
            shadow: false,
            translate: [0, 0, -400],
          },
          next: {
            translate: ['12%', 0, -100],
          },
        }}
        style={{ overflow: 'visible', padding: '20px 0' }}
      >
        {courses.map((course) => (
          <SwiperSlide key={course.id} style={{ 
             borderRadius: '24px',
             backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
             border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
             boxShadow: isDark ? '0 10px 40px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.06)',
             boxSizing: 'border-box'
          }}>
            <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', height: '100%', gap: '28px' }}>
               
               {/* Header Info */}
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  {course.badge && (
                     <div style={{ 
                        background: `${course.levelColor}20`, 
                        color: course.levelColor,
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '4px'
                     }}>
                        {course.badge}
                     </div>
                  )}
                  <h3 style={{ fontSize: '24px', fontWeight: '800', color: isDark ? '#F8FAFC' : '#0F172A', margin: 0, textAlign: 'center' }}>
                     {course.title}
                  </h3>
                  <h5 style={{ fontSize: '13px', fontWeight: '700', color: course.levelColor, letterSpacing: '0.05em', margin: 0 }}>
                     {course.level}
                  </h5>
               </div>

               {/* Center Image */}
               <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <img src={course.image} alt={course.title} style={{ width: '100%', maxWidth: '200px', height: '150px', objectFit: 'contain' }} />
               </div>

               {/* Items List */}
               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
                  {course.items.map((item, index) => (
                     <div key={index} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        opacity: item.active ? 1 : 0.5,
                        cursor: 'pointer'
                     }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                           <div style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {item.icon}
                           </div>
                           <span style={{ fontSize: '16px', fontWeight: item.active ? '700' : '600', color: isDark ? '#F1F5F9' : '#1E293B' }}>
                              {item.title}
                           </span>
                        </div>
                        {/* Status Icon */}
                        <div style={{ 
                           width: '16px', height: '16px', 
                           borderRadius: '50%', 
                           background: item.active ? 'transparent' : (isDark ? '#334155' : '#E2E8F0'),
                           border: item.active ? `2px solid ${isDark ? '#475569' : '#CBD5E1'}` : 'none',
                           display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                           {/* Empty or filled state */}
                        </div>
                     </div>
                  ))}
               </div>

               {/* Start Button */}
               <button style={{
                  width: '100%',
                  padding: '18px 0',
                  background: '#456DFF',
                  color: 'white',
                  border: 'none',
                  borderRadius: '16px',
                  fontSize: '18px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  marginTop: '12px',
                  boxShadow: '0 4px 14px rgba(69, 109, 255, 0.4)'
               }}>
                  <span style={{ position: 'relative', zIndex: 2 }}>Start</span>
                  {/* Decorative waves in the button */}
                  <svg viewBox="0 0 150 56" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.2, zIndex: 1, pointerEvents: 'none' }} preserveAspectRatio="none">
                     <g clipPath="url(#clip0)">
                        <rect x="75" y="-58" width="51" height="150" transform="rotate(30 75 -58)" fill="white"></rect>
                        <rect x="127" y="-28" width="26" height="150" transform="rotate(30 127 -28)" fill="white"></rect>
                     </g>
                     <defs>
                        <clipPath id="clip0"><rect width="150" height="56" fill="white"></rect></clipPath>
                     </defs>
                  </svg>
               </button>

            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default CourseCardSwiper;
