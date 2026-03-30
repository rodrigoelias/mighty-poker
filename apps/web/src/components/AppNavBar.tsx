import BpkNavigationBar, { BAR_STYLES } from '@skyscanner/backpack-web/bpk-component-navigation-bar';

export function AppNavBar() {
  return (
    <BpkNavigationBar
      id="main-nav"
      title="Mighty Poker"
      barStyle={BAR_STYLES.onDark}
      leadingButton={
        <span style={{ fontSize: '1.25rem' }}>&#9824;</span>
      }
    />
  );
}
