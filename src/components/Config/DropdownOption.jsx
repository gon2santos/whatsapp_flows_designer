import OptionsField from './OptionsField'
import JumpToScreen from './JumpToScreen'

const DropdownOption = (props) => (
    <>
        <OptionsField {...props} addLabel="Add option" />
        <JumpToScreen {...props} />
    </>
);

export default DropdownOption;
