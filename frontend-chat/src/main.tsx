import React, {useEffect} from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import {createBrowserRouter, RouterProvider} from "react-router-dom";

const CallComponent = () => {
    useEffect(() => {
        window.location.href = 'tel:1360'
    }, []);

    return <>
    </>
}

const router = createBrowserRouter([
    {
        path: "/",
        element: <CallComponent />,
    },
    {
        path: '/call',
        element: <CallComponent/>
    }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
      <RouterProvider router={router} />
  </React.StrictMode>,
)
