
import { Link } from "react-router-dom"

function Hero() {
  return (
    <section>
      <h1>This is the entry point of this app</h1>
      <Link to='/sign-up'>Sign up</Link>
      <Link to='/login'>Login</Link>
    </section>
  )
}

export default Hero