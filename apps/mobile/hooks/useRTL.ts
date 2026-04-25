// RTL helper — returns direction-aware style values
import { I18nManager } from 'react-native';

export function useRTL() {
  const isRTL = I18nManager.isRTL;

  return {
    isRTL,
    textAlign:     isRTL ? 'right'  : 'left'  as const,
    flexDirection: isRTL ? 'row-reverse' : 'row' as const,
    start:         isRTL ? 'right'  : 'left'  as const,
    end:           isRTL ? 'left'   : 'right' as const,
    marginStart:   (v: number) => isRTL ? { marginRight: v } : { marginLeft: v },
    marginEnd:     (v: number) => isRTL ? { marginLeft: v }  : { marginRight: v },
    paddingStart:  (v: number) => isRTL ? { paddingRight: v }: { paddingLeft: v },
  };
}
