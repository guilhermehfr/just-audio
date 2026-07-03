import { Footer } from '@/components/footer'
import { Navbar } from '@/components/navbar'
import { SearchBar } from '@/components/search-bar'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 pt-[40px] lg:pt-[51px] px-5">
        <SearchBar />
      </div>
      <Footer />
    </div>
  )
}
