export default function Carrousel() {
  return (
    <div className="p-4 space-x-4 carousel carousel-center bg-neutral rounded-box bg-opacity-60 opacity-80">
      <div className="carousel-item h-96">
        <img src="./3.png" className="rounded-box" />
      </div> 
      <div className="carousel-item h-96">
        <img src="./4.png" className="rounded-box" />
      </div> 
      <div className="carousel-item h-96">
        <img src="./5.png" className="rounded-box" />
      </div> 
    </div>
  )
}