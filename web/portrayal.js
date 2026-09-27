// Inspection symbols only; these do not implement IHO S-52 portrayal.
export const detailZoom = {M_COVR: 12, DEPCNT: 11, SOUNDG: 14, BOYLAT: 11, BOYSAW: 11, BOYSPP: 11, BCNLAT: 11, LIGHTS: 11, WRECKS: 12, UWTROC: 12, OBSTRN: 12};
export const symbols = {BOYLAT: '◇', BOYSAW: '◇', BOYSPP: '◇', BCNLAT: '△', LIGHTS: '✦', WRECKS: '×', UWTROC: '+', OBSTRN: '□'};

export function installImages(map) {
  map.on('styleimagemissing', ({id}) => {
    if (!id.startsWith('depth:') && !id.startsWith('aid:')) return;
    const depth = id.startsWith('depth:');
    const text = depth ? id.slice(6) : symbols[id.slice(4)];
    if (!text || (depth && !/^-?\d+(\.\d+)?$/.test(text))) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const font = depth ? '500 24px sans-serif' : 'bold 36px sans-serif';
    ctx.font = font;
    canvas.width = Math.ceil(ctx.measureText(text).width) + 12;
    canvas.height = depth ? 36 : 48;
    ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 5; ctx.strokeStyle = '#ffffff';
    ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = depth ? '#183f50' : id === 'aid:LIGHTS' ? '#865298' : ['aid:WRECKS', 'aid:UWTROC', 'aid:OBSTRN'].includes(id) ? '#8e2345' : '#364b44';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    map.addImage(id, ctx.getImageData(0, 0, canvas.width, canvas.height), {pixelRatio: 2});
  });
}
