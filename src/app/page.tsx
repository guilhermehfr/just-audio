import { Footer } from '@/components/footer'
import { Navbar } from '@/components/navbar'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 px-2"></div>
      <Footer />
    </div>
  )
}
