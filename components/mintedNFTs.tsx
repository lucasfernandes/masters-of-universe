import Image from 'next/image'

interface mintedNFTsProps {
  mints: Array<string>;
}

export default function MintedNFTs({mints}: mintedNFTsProps) {
  return (
    mints.length > 0
    ? (
      <>
        <p className="text-white text-6xl py-12">All NFTs minted</p>
        <div className="grid grid-cols-3 gap-6">
          {mints.map((mint, index) => (
            <div key={index} className='w-96 h-64 relative'>
              <Image src={mint} alt={`Minted NFT ${mint}`} className="rounded-lg" layout='fill' objectFit="cover" />
            </div>
          ))}
        </div>
      </>
    ) : (
      <div className='flex flex-1'>
        <button className="btn btn-sm btn-ghost loading text-white p-0">loading minted nfts...</button>
      </div>
    )
    
  )
}