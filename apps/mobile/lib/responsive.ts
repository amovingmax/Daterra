import { useWindowDimensions } from 'react-native';

/** A partir desta largura tratamos como tablet (iPad em retrato ~768-834pt). */
export const TABLET_BREAKPOINT = 768;

/** Larguras máximas de conteúdo no tablet — evitam que a UI "estique" sem fim. */
export const FORM_MAX_WIDTH = 520; // telas de formulário (login, cadastro, perfil)
export const CONTENT_MAX_WIDTH = 760; // telas de conteúdo (home, loja, carrinho…)

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  return { width, height, isTablet };
}
