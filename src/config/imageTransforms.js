/**
 * Image Transforms Configuration
 * 
 * Este arquivo gerencia todas as transformações customizadas de imagens dos membros da equipa.
 * 
 * COMO USAR:
 * 1. Adicione uma entrada com o NOME EXATO do membro (conforme aparece em locales/pt.json)
 * 2. Escolha uma transformação disponível abaixo
 * 3. Pronto! A imagem será transformada automaticamente
 * 
 * Cada chave deve ser o nome do membro (deve coincidir EXATAMENTE com locales/pt.json).
 * Cada valor pode ser:
 *   - Uma string: Nome de uma classe CSS
 *   - Um array de strings: Múltiplas classes CSS
 *   - Um objeto: { className: 'class-name', description: 'Descrição' }
 * 
 * As classes CSS estão definidas em src/styles.css na secção "IMAGE TRANSFORM CLASSES".
 */

export const IMAGE_TRANSFORMS = {
  // EXEMPLOS (descomente para usar):
  
  // 'Rodrigo Ramos': 'img-zoom-out',  // Exemplo: zoom out
  // 'João Silva': ['img-zoom-out', 'img-brightness-up'],  // Múltiplos efeitos
  // 'Tiago Furtado': {
  //   className: 'img-grayscale',
  //   description: 'Foto em preto e branco para destaque'
  // },

  // Ajustes reais em produção:
  'Francisco Silva': 'img-shift-down-small',
  'Rodrigo Ramos': 'img-shift-down-tiny',
  'Rodrigo Gonçalves': 'img-shift-down-tiny',
  'Miguel Birsanu': 'img-shift-left-small',
  'Gabriel Pinto': 'img-shift-down-large',
  'Ricardo Sardinha': 'img-shift-left-medium-up-tiny',
};

/**
 * TRANSFORMAÇÕES DISPONÍVEIS (Referência)
 * 
 * ZOOM:
 *   - img-zoom-out     : Reduz a imagem para 75%
 *   - img-zoom-in      : Amplia a imagem para 125%
 * 
 * CORES E FILTROS:
 *   - img-grayscale    : Converte para preto e branco
 *   - img-sepia        : Aplica tom sépia
 *   - img-blur         : Desfoque leve (2px)
 * 
 * BRILHO E CONTRASTE:
 *   - img-brightness-up   : Aumenta brilho em 20%
 *   - img-brightness-down : Diminui brilho em 20%
 *   - img-contrast-up     : Aumenta contraste em 20%
 * 
 * OPACIDADE:
 *   - img-opacity-75   : Define opacidade em 75%
 * 
 * COMBINAR EFEITOS:
 * Pode combinar múltiplos efeitos usando um array:
 *   'Nome': ['img-zoom-out', 'img-brightness-up']
 * 
 * ADICIONAR NOVOS EFEITOS:
 * 1. Defina a classe CSS em src/styles.css
 * 2. Use o nome da classe aqui
 * 
 * @example
 * // Fazer zoom out em uma foto
 * 'Rodrigo Ramos': 'img-zoom-out',
 * 
 * @example
 * // Múltiplos efeitos combinados
 * 'João Silva': ['img-zoom-out', 'img-sepia'],
 * 
 * @example
 * // Com documentação extra
 * 'Tiago Furtado': {
 *   className: 'img-grayscale',
 *   description: 'Preto e branco para tema especial'
 * }
 */

// ============================================================
// INSTRUÇÕES RÁPIDAS:
// 
// 1. Copie o exemplo abaixo
// 2. Substitua "Nome do Membro" pelo nome exato (case-sensitive!)
// 3. Escolha uma transformação acima
// 4. Descomente e pronto!
// ============================================================

/*
export const IMAGE_TRANSFORMS = {
  'Nome do Membro': 'img-zoom-out',
};
*/

