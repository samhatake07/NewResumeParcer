import './App.css'
import UploadSection from './components/UploadSection'

export default function App() {
  return (
    <>
      <header className="nav">
        <div className="container nav-inner">
          <a className="logo" href="#">
            0<span>→</span>Shipped <em>Resume Parser</em>
          </a>
          <nav>
            <a href="#upload">Parser</a>
            <a href="#how">How it works</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container">
            <p className="eyebrow">One resume · One job · One score</p>
            <h1>
              Does your resume <span className="accent">match this job?</span>
            </h1>
            <p className="sub">
              Drop in your resume PDF and paste the job description you're
              applying to. We read both, then tell you what the posting asks for,
              what your resume actually shows, and how the two line up.
            </p>
          </div>
        </section>

        <UploadSection />

        <section id="how" className="how">
          <div className="container how-grid">
            <div className="how-step">
              <span className="step-num">1</span>
              <h3>Upload</h3>
              <p>Drop a PDF of your resume and paste the job description it's aimed at.</p>
            </div>
            <div className="how-step">
              <span className="step-num">2</span>
              <h3>Compare</h3>
              <p>The server pulls the text out of both and has labd judge one against the other.</p>
            </div>
            <div className="how-step">
              <span className="step-num">3</span>
              <h3>Ship</h3>
              <p>Fix what the job asks for and your resume doesn't show, then compare again.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <p>0 to Shipped Resume Parser — upload your PDF, compare it to the job.</p>
        </div>
      </footer>
    </>
  )
}
