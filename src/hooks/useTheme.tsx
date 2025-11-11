import React from 'react';

import {light} from '../constants/';
import {ITheme, IThemeProvider} from '../constants/types';

export const ThemeContext = React.createContext({
  theme: light,
  setTheme: (() => {}) as React.Dispatch<React.SetStateAction<ITheme>>,
});

export const ThemeProvider = ({
  children,
  theme = light,
  setTheme = () => {},
}: IThemeProvider) => {
  return (
    <ThemeContext.Provider
      value={{theme, setTheme: setTheme as React.Dispatch<React.SetStateAction<ITheme>>}}>
      {children}
    </ThemeContext.Provider>
  );
};

export default function useTheme(): ITheme {
  const {theme} = React.useContext(ThemeContext);
  return theme;
}
