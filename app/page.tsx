import { Button } from "@/components/ui/button";
import Link from "next/link";


export default function Home() {

  return (
    <main className="h-screen bg-gray-300">
      <div className="text-5xl font-serif text-center pt-12"> 
        Video call(WebRTC) and transcoding
      </div>
    <div className="flex h-max justify-center items-center"> 
    <div className="flex flex-col gap-4">

      <Link href={"/stream"}><Button  variant="default" size={"lg"}  >Stream</Button></Link>
      <Link href={"/watch"}><Button  variant="default" size={"lg"} >Watch</Button></Link>
    </div>     
    </div>
    </main>

  );
}
