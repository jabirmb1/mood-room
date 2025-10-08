// a file containing some consts that releates to UI.

/********* consts relating to theming */

// in tailwind css notation.
export const darkThemeBackground = 'bg-black';
export const lightThemeBackground = 'bg-white';

export const darkThemeBackgroundSecondary = 'bg-gray-600'
export const darkThemeBackgroundTertiary = 'bg-gray-800'

export const darkThemeText = 'text-white';
export const darkThemeSecondaryText = 'text-gray-300'
export const darkThemeTitle = 'text-gray-400';

export const lightThemeText = 'text-black';
export const lightThemeSecondaryText = 'text-gray-700'
export const lightThemeTitle = 'text-gray-900'

export const darkThemeBorder = 'border-white';
export const lightThemeBorder = 'border-black'

export const darkTheme = darkThemeBackground + ' ' + darkThemeText;
export const lightTheme = lightThemeBackground + ' ' + lightThemeText;


/**** const relating to visuals of actual html elements *******/

// style for error messages:
export const errorMessageStyle = "mt-4 p-3 border-red-700 border-2 bg-red-900/50 text-white" + 
" rounded-2xl w-full text-center"