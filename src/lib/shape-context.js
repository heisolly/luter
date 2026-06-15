import { createContext, useContext } from 'react';

const ShapeContext = createContext({
  bg: 'rounded-xl',
  focusRing: 'rounded-xl'
});

export const useShape = () => {
  return useContext(ShapeContext);
};
