import 'bootstrap/dist/css/bootstrap.min.css';
import { Home } from './components/home';
import { ParticlesContainer } from './components/ParticleContainer.tsx';

function App() {
  return (
    <div className='App' style={{ height: '100vh' }}>
      <header className='App-header'></header>
      <div style={{ position: 'absolute' }}>
        <ParticlesContainer />
      </div>
      <Home></Home>
    </div>
  );
}

export default App;
