import Image from 'next/image'
import React, { useEffect, ReactChildren, ReactChild } from 'react';
import Navbar from './navbar'
import Footer from './footer';
// import Carrousel from './carrousel'
 
interface LayoutProps {
  children: ReactChild | ReactChildren;
}

export default function Layout({ children }: LayoutProps) {
  useEffect(() => {
    const WebFontLoader = require("webfontloader");
    WebFontLoader.load({
      google: {
        families: ["Carrois Gothic:400", "DotGothic16:400", "Pathway Gothic One:400"],
      },
    });
  }, []);

  return (
    <div className="bg-grayskull bg-center bg-cover bg-no-repeat font-DotGothic16 pb-10">
      <div className='p-8'>
        <Navbar />
        {children}
      </div>
      <Footer />
    </div>
  )
}