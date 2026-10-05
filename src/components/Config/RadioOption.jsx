import OptionsField from './OptionsField'
import JumpToScreen from './JumpToScreen'

const RadioOption = (props) => (
    <>
        <OptionsField {...props} addLabel="Add option" labelMaxLength={30} />
        <JumpToScreen {...props} />
    </>
);

export default RadioOption;
