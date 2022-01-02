import Image from 'next/image'
import React, { useEffect, ReactChildren, ReactChild } from 'react';
import Navbar from './navbar'
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
    <div className="bg-grayskull bg-center bg-cover bg-no-repeat p-8 font-DotGothic16">
      <Navbar />
      {children}
    </div>
  )
}