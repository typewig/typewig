import '../../env';
import { expect } from 'chai';

import SimpleControl from './SimpleControl';
import { MidiMessage } from '../midi/';

const control = new SimpleControl({ status: 0xb0, data1: 21 });

describe('SimpleControl', () => {
    it('should generate correct input', () => {
        const { status, data1 } = control;
        expect(control.getInput(new MidiMessage({ status, data1, data2: 127 }))).to.deep.equal({
            value: 1,
        });
    });

    it('should generate correct output', () => {
        const { status, data1 } = control;
        const data2 = Math.round(control.state.value * 127);
        expect(control.getMidiOutput(control.state)).to.deep.equal([
            new MidiMessage({ status, data1, data2 }),
        ]);
    });
});