import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next'
import twitterLogo from '../public/twitter-logo.svg';
import CandyMachine from '../components/candyMachine.js';
import Carrousel from '../components/carrousel';
import Footer from '../components/footer';
import MintedNFTs from '../components/mintedNFTs';

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

declare global {
    interface Window {
        solana:any;
    }
}

const Home: NextPage = () => {

  const [walletAddress, setWalletAddres] = useState(null);
  const [mints, setMints] = useState([]);
  
  const checkIfWalletIsConnected = async () => {
    try {
      if(typeof window !== "undefined") {
        const { solana } = window;

        if (solana) {
            if (solana.isPhantom) {
            console.log("Phantom wallet found!");

            const response = await solana.connect({ onlyIfTrusted: true })
            console.log(
                "Connected with Public Key:",
                response.publicKey.toString()
            )

            setWalletAddres(response.publicKey.toString());
            }
        } else {
            alert('Solana object not found! Get a Phantom Wallet 👻');
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  const connectWallet = async () => {
    if(typeof window !== "undefined") {
      const { solana } = window;

      if (solana) {
        const response = await solana.connect();
        console.log('Connected with Public Key: ', response.publicKey.toString());

        setWalletAddres(response.publicKey.toString());
      }
    }
  };

  const renderNotConnectedContainer = () => (
    <button
      className='cta-button mint-button font-CarroisGothic mt-8'
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );
  

  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    }

    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, [])

  return (
    <>
      <div className="flex flex-row justify-between items-center pt-12">
        <div className='flex-1 text-2xl text-white pr-4'>
          <h1 className='text-5xl font-bold pb-4 font-PathwayGothicOne'>Masters of Universe NFT collection</h1>
          <p>Imagine yourself back in the past with the epic batles between He-Man and Skeletor to conquer the Grayskull castle. Reconnect yourself with nostalgic past memories.</p>
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && <CandyMachine walletAddress={window.solana} mints={mints} setMints={setMints} />}
        </div>
        <div className='flex-1'>
          <Carrousel />
        </div>
      </div>
      {walletAddress && <MintedNFTs mints={mints} />}
      <Footer />
    </>
  );
};

export default Home