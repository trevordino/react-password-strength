import React from 'react';
import Particles from 'react-tsparticles';
import type { Engine } from 'tsparticles';
import { loadStarsPreset } from 'tsparticles-preset-stars';

export class ParticlesContainer extends React.PureComponent<IProps> {
  // this customizes the component tsParticles installation
  async customInit(engine: Engine): Promise<void> {
    // this adds the preset to tsParticles, you can safely use the
    await loadStarsPreset(engine);
  }

  render() {
    const options = {
      background: {
        color: {
          value: '#a56bb3',
        },
      },
      fullScreen: {
        enable: true,
        zIndex: '-1',
      },
      preset: 'stars',
    };

    return <Particles options={options} init={this.customInit} />;
  }
}
