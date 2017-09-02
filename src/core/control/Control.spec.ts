import { session } from '../../taktil';
import { Control } from './Control';
import { MidiMessage, SysexMessage } from '../midi/';
import { Button } from '../component/Button';

type TestControlState = { value: number; nested: { value: number } };

class TestControl extends Control<TestControlState> {
    name = 'TEST_CONTROL';
    state = { value: 127, nested: { value: 0 } };

    getControlInput(message: MidiMessage | SysexMessage) {
        return { ...this.state };
    }

    getMidiOutput({ value }: TestControlState) {
        return [
            new MidiMessage({
                status: 0xb0,
                data1: 0x1f,
                data2: value,
            }),
        ];
    }
}

class TestComponent extends Button {
    state = { on: false };
}

describe('Control', () => {
    const control = new TestControl('00B01F??');
    const component = new TestComponent(control, {});

    it('should initialize state correctly', () => {
        expect(control.state).toEqual({ value: 127, nested: { value: 0 } });
    });

    it('should modify state correctly', () => {
        control.setState({ nested: { value: 1 } }); // receives partial state
        expect(control.state).toEqual({ value: 127, nested: { value: 1 } });
    });

    it('should maintain its initial state', () => {
        expect(control.defaultState).toEqual({
            value: 127,
            nested: { value: 0 },
        });
    });

    it('should set active component correctly', () => {
        // should be initialized as null
        expect(control.activeComponent).toBe(null);
        control.activeComponent = component;
        expect(control.activeComponent).toBe(component);
        // state.value should have been changed to 0 because of initial
        // component state
        expect(control.state.value).toBe(0);
    });

    it('should throw on invalid setState of state.value', () => {
        expect(() => control.setState({ value: 128 })).toThrow();
    });

    it('should cache controller hardware state', () => {
        control.setState({ value: 0 });
        const spy = jest.spyOn(session.midiOut, 'sendMidi');
        control.setState({ value: 127 });
        control.setState({ value: 127 });
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should skip render in certain situations', () => {
        control.enableMidiOut = false;
        expect(control.render()).toBe(false);

        control.enableMidiOut = true;
        expect(control.render()).toBe(true);
    });

    it('should set shared port, status, data1, and data2 from patterns', () => {
        const { port, status, data1, data2 } = new TestControl('00B41900', '00B41801');
        expect({ port, status, data1, data2 }).toEqual({ port: 0, status: 0xb4 });
    });

    it('should generate correct input for simple control', () => {
        const control = new Control({ status: 0xb0, data1: 21 });
        const { status, data1 } = control as { status: number; data1: number };
        expect(
            control.getControlInput(new MidiMessage({ status, data1, data2: control.maxValue }))
        ).toEqual({
            value: control.maxValue,
        });
    });

    it('should generate correct output for simple control', () => {
        const control = new Control({ status: 0xb0, data1: 21 });
        const { status, data1, state: { value } } = control as {
            status: number;
            data1: number;
            state: { value: number };
        };
        expect(control.getMidiOutput(control.state)).toEqual([
            new MidiMessage({ status, data1, data2: value }),
        ]);
    });
});
