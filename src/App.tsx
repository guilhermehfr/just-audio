import { Navbar } from './components/navbar'
import { Footer } from './components/footer'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 px-2"></div>
      <Footer />
    </div>
  )
}
