import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './AuthContext'
import './styles.css'
import './success-modal.css'
const savedFontSize=localStorage.getItem('school-attendance-font-size')
if(savedFontSize&&['small','default','large','extra-large'].includes(savedFontSize))document.documentElement.dataset.fontSize=savedFontSize
else document.documentElement.dataset.fontSize='default'

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><HashRouter><AuthProvider><App/></AuthProvider></HashRouter></React.StrictMode>)
if(location.protocol.startsWith('http')&&'serviceWorker'in navigator&&import.meta.env.PROD)window.addEventListener('load',()=>navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`))

