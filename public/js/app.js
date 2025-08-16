function startCountdown(id, endAt){
  const el = document.getElementById(id);
  function tick(){
    const diff = new Date(endAt) - new Date();
    if(diff <= 0){ el.textContent='Terminé'; return; }
    const h = Math.floor(diff/3600000);
    const m = Math.floor((diff%3600000)/60000);
    const s = Math.floor((diff%60000)/1000);
    el.textContent = `${h}h ${m}m ${s}s`;
    requestAnimationFrame(tick);
  }
  tick();
}
