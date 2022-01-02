import Image from 'next/image'
import Logo from '../public/logo2.png'
import Twitter from "../public/twitter-logo.svg"
import Github from "../public/iconmonstr-github-1.svg"
export default function Navbar() {
  return (
    <div className=" py-4 rounded-lg flex flex-row justify-between items-center">
      <Image src={Logo} width="300" height="116" alt="logo" className='drop-shadow-xl opacity-90' />
      <div className="text-xl bg-gray-600 flex flex-row justify-center items-center space-x-4 px-8 py-2 pt-3 rounded-full bg-opacity-80">
        <a href="https://twitter.com/lfsilveira" target="blank">
          <Image src={Github} width="34" height="34" alt="twitter" className='drop-shadow-xl' />
        </a>
        <a href="https://twitter.com/lfsilveira" target="blank">
          <Image src={Twitter} width="48" height="48" alt="twitter" className='drop-shadow-xl' />
        </a>
      </div>
    </div>
  )
}