import React, { useState, useEffect, useCallback } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';
import { MintLayout, TOKEN_PROGRAM_ID, Token } from '@solana/spl-token';
import { programs } from '@metaplex/js';

import {
  candyMachineProgram,
  TOKEN_METADATA_PROGRAM_ID,
  SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
} from './helpers';

import CountdownTimer from './countdownTimer';

const {
  metadata: { Metadata, MetadataProgram },
} = programs;


const config = new web3.PublicKey(process.env.NEXT_PUBLIC_CANDY_MACHINE_CONFIG);
const { SystemProgram } = web3;
const opts = {
  preflightCommitment: 'processed',
};

const MAX_NAME_LENGTH = 32;
const MAX_URI_LENGTH = 200;
const MAX_SYMBOL_LENGTH = 10;
const MAX_CREATOR_LEN = 32 + 1 + 1;

const CandyMachine = ({ walletAddress, mints, setMints }) => {
  // States
  const [machineStats, setMachineStats] = useState(null);
  // const [mints, setMints] = useState([]);
  const [isMinting, setIsMinting] = useState(false);
  const [isLoadingMints, setIsLoadingMints] = useState(false);


  // Actions
  const fetchHashTable = async (hash, metadataEnabled) => {
    const connection = new web3.Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_HOST
    );

    const metadataAccounts = await MetadataProgram.getProgramAccounts(
      connection,
      {
        filters: [
          {
            memcmp: {
              offset:
                1 +
                32 +
                32 +
                4 +
                MAX_NAME_LENGTH +
                4 +
                MAX_URI_LENGTH +
                4 +
                MAX_SYMBOL_LENGTH +
                2 +
                1 +
                4 +
                0 * MAX_CREATOR_LEN,
              bytes: hash,
            },
          },
        ],
      }
    );

    const mintHashes = [];

    for (let index = 0; index < metadataAccounts.length; index++) {
      const account = metadataAccounts[index];
      const accountInfo = await connection.getParsedAccountInfo(account.pubkey);
      const metadata = new Metadata(hash.toString(), accountInfo.value);
      if (metadataEnabled) mintHashes.push(metadata.data);
      else mintHashes.push(metadata.data.mint);
    }

    return mintHashes;
  };

  const getMetadata = async (mint) => {
    return (
      await PublicKey.findProgramAddress(
        [
          Buffer.from('metadata'),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mint.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      )
    )[0];
  };

  const getMasterEdition = async (mint) => {
    return (
      await PublicKey.findProgramAddress(
        [
          Buffer.from('metadata'),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mint.toBuffer(),
          Buffer.from('edition'),
        ],
        TOKEN_METADATA_PROGRAM_ID
      )
    )[0];
  };

  const getTokenWallet = async (wallet, mint) => {
    return (
      await web3.PublicKey.findProgramAddress(
        [wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
        SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
      )
    )[0];
  };

  const mintToken = async () => {
    try {
      setIsMinting(true);
      const mint = web3.Keypair.generate();
      const token = await getTokenWallet(
        walletAddress.publicKey,
        mint.publicKey
      );
      const metadata = await getMetadata(mint.publicKey);
      const masterEdition = await getMasterEdition(mint.publicKey);
      const rpcHost = process.env.NEXT_PUBLIC_SOLANA_RPC_HOST;
      const connection = new Connection(rpcHost);
      const rent = await connection.getMinimumBalanceForRentExemption(
        MintLayout.span
      );

      const accounts = {
        config,
        candyMachine: process.env.NEXT_PUBLIC_CANDY_MACHINE_ID,
        payer: walletAddress.publicKey,
        wallet: process.env.NEXT_PUBLIC_TREASURY_ADDRESS,
        mint: mint.publicKey,
        metadata,
        masterEdition,
        mintAuthority: walletAddress.publicKey,
        updateAuthority: walletAddress.publicKey,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
        clock: web3.SYSVAR_CLOCK_PUBKEY,
      };

      const signers = [mint];
      const instructions = [
        web3.SystemProgram.createAccount({
          fromPubkey: walletAddress.publicKey,
          newAccountPubkey: mint.publicKey,
          space: MintLayout.span,
          lamports: rent,
          programId: TOKEN_PROGRAM_ID,
        }),
        Token.createInitMintInstruction(
          TOKEN_PROGRAM_ID,
          mint.publicKey,
          0,
          walletAddress.publicKey,
          walletAddress.publicKey
        ),
        createAssociatedTokenAccountInstruction(
          token,
          walletAddress.publicKey,
          walletAddress.publicKey,
          mint.publicKey
        ),
        Token.createMintToInstruction(
          TOKEN_PROGRAM_ID,
          mint.publicKey,
          token,
          walletAddress.publicKey,
          [],
          1
        ),
      ];

      const provider = getProvider();
      const idl = await Program.fetchIdl(candyMachineProgram, provider);
      const program = new Program(idl, candyMachineProgram, provider);

      const txn = await program.rpc.mintNft({
        accounts,
        signers,
        instructions,
      });

      console.log('txn:', txn);

      // Setup listener
      connection.onSignatureWithOptions(
        txn,
        async (notification, context) => {
          if (notification.type === 'status') {
            console.log('Receievd status event');

            const { result } = notification;
            if (!result.err) {
              console.log('NFT Minted!');

              setIsMinting(false);
              await getCandyMachineState();
            }
          }
        },
        { commitment: 'processed' }
      );
    } catch (error) {
      let message = error.msg || 'Minting failed! Please try again!';
      setIsMinting(false);

      if (!error.msg) {
        if (error.message.indexOf('0x138')) {
        } else if (error.message.indexOf('0x137')) {
          message = `SOLD OUT!`;
        } else if (error.message.indexOf('0x135')) {
          message = `Insufficient funds to mint. Please fund your wallet.`;
        }
      } else {
        if (error.code === 311) {
          message = `SOLD OUT!`;
        } else if (error.code === 312) {
          message = `Minting period hasn't started yet.`;
        }
      }

      console.warn(message);
    }
  };

  const createAssociatedTokenAccountInstruction = (
    associatedTokenAddress,
    payer,
    walletAddress,
    splTokenMintAddress
  ) => {
    const keys = [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: associatedTokenAddress, isSigner: false, isWritable: true },
      { pubkey: walletAddress, isSigner: false, isWritable: false },
      { pubkey: splTokenMintAddress, isSigner: false, isWritable: false },
      {
        pubkey: web3.SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      {
        pubkey: web3.SYSVAR_RENT_PUBKEY,
        isSigner: false,
        isWritable: false,
      },
    ];
    return new web3.TransactionInstruction({
      keys,
      programId: SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
      data: Buffer.from([]),
    });
  };

  const getProvider = () => {
    const rpcHost = process.env.NEXT_PUBLIC_SOLANA_RPC_HOST;
    const connection = new Connection(rpcHost);

    const provider = new Provider(
      connection,
      window.solana,
      opts.preflightCommitment
    );

    return provider;
  }

  const getCandyMachineState = useCallback(async () => {
    const provider = getProvider();
    const idl = await Program.fetchIdl(candyMachineProgram, provider);
    const program = new Program(idl, candyMachineProgram, provider);
    const candyMachine = await program.account.candyMachine.fetch(
      process.env.NEXT_PUBLIC_CANDY_MACHINE_ID
    );

    const itemsAvailable = candyMachine.data.itemsAvailable.toNumber();
    const itemsRedeemed = candyMachine.itemsRedeemed ? candyMachine.itemsRedeemed.toNumber() : 0;
    const itemsRemaining = itemsAvailable - itemsRedeemed;
    const goLiveDate = candyMachine.data.goLiveDate.toNumber();

    // console.log("===========>")
    // console.log(candyMachine.data)
    // console.log(candyMachine.itemsRedeemed)

    const goLiveDateTimeString = `${new Date(
      goLiveDate * 1000
    ).toGMTString()}`

    setMachineStats({
      itemsAvailable,
      itemsRedeemed,
      itemsRemaining,
      goLiveDate,
      goLiveDateTimeString,
    });

    console.log({
      itemsAvailable,
      itemsRedeemed,
      itemsRemaining,
      goLiveDate,
      goLiveDateTimeString,
    });

    setIsLoadingMints(true);

    const data = await fetchHashTable(
      process.env.NEXT_PUBLIC_CANDY_MACHINE_ID,
      true
    )

    if (data.length !== 0) {
      const requests = data.map(async (mint) => {
        try {
          const response = await fetch(mint.data.uri);
          const parse = await response.json();
          console.log("Past Minted NFT", mint);

          return parse.image;
        } catch (error) {
          console.error("Failed retrieving Minted NFT", mint);
          return null;
        }
      })

      const allMints = await Promise.all(requests);
      const filteredMints = allMints.filter(mint => mint !== null);

      setMints(filteredMints);
    }

    setIsLoadingMints(false)
  }, [])

  // const renderMintedItems = () => (
  //   <div className="gif-container">
  //     <p className="sub-text">Minted Items ✨</p>
  //     <div className="gif-grid">
  //       {mints.map((mint) => (
  //         <div className="gif-item" key={mint}>
  //           <img src={mint} alt={`Minted NFT ${mint}`} />
  //         </div>
  //       ))}
  //     </div>
  //   </div>
  // );

  const renderDropTimer = () => {
    // Get the current date and dropDate in a JavaScript Date object
    const currentDate = new Date();
    const dropDate = new Date(machineStats.goLiveDate * 1000);
  
    // If currentDate is before dropDate, render our Countdown component
    if (currentDate < dropDate) {
      console.log('Before drop date!');
      // Don't forget to pass over your dropDate!
      return <CountdownTimer dropDate={dropDate} />;
    }
  
    // Else let's just return the current drop date
    return <p>{`Drop Date: ${machineStats.goLiveDateTimeString}`}</p>;
  };

  useEffect(() => {
    getCandyMachineState();
  }, [getCandyMachineState])

  return machineStats ? (
    <div className="text-base pt-6">
      {renderDropTimer()}
      <p>{`Items Minted: ${machineStats.itemsRedeemed} / ${machineStats.itemsAvailable}`}</p>
      {machineStats.itemsRedeemed === machineStats.itemsAvailable ? (
          <p className="sub-text">Sold Out 🙊</p>
        ) : (
          <button
            className="cta-button mint-button font-CarroisGothic mt-8"
            onClick={mintToken}
            disabled={isMinting}
          >
            MINT
          </button>
        )}
      {/* {isLoadingMints && <p>LOADING MINTS...</p>}
      {mints.length > 0 && renderMintedItems()} */}
    </div>
  ) : (
    <div className='flex flex-1'>
      <button className="btn btn-sm btn-ghost loading text-white mt-12 p-0">loading stats...</button>
    </div>
  )
};

export default CandyMachine;
