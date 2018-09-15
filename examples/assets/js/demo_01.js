(() => {
  
  /**
   * WebRTCによるカメラアクセス
   */
  const video = document.getElementById('video')
  const canvas = document.getElementById('canvas')
  const ctx = canvas.getContext('2d')
  
  let isVideoRun = true
  let isLoadedMetaData = false
  let constraints = { audio: false, video: {facingMode: 'user'} }

  let audioContext = new (window.AudioContext || window.webkitAudioContext)()
  let oscillator = audioContext.createOscillator()
  let gain = audioContext.createGain()
  const BASE_FREQUENCY = 440

  const startBtn = document.getElementById('start_btn')
  let isAudioRun = false
  let isMuted = true


  oscillator.type = 'sine'
  oscillator.frequency.value = BASE_FREQUENCY
  oscillator.connect( gain )
  gain.connect( audioContext.destination )

  function start(){
    navigator.mediaDevices.getUserMedia( constraints )
      .then( mediaStrmSuccess )
      .catch( mediaStrmFailed )
  }

  function mediaStrmSuccess( stream ){
    video.srcObject = stream

    // ウェブカムのサイズを取得し、canvasにも適用
    if(isLoadedMetaData) return
    isLoadedMetaData = true

    video.addEventListener('loadedmetadata', () => {
      canvas.width = video.videoWidth  
      canvas.height = video.videoHeight

      requestAnimationFrame( draw )
    }, false)
  }

  function mediaStrmFailed( e ){
    console.log( e )
  }

  function stop(){
    let stream = video.srcObject
    let tracks = stream.getTracks()

    tracks.forEach( (track) => {
      track.stop()
    })
    video.srcObject = null
  }

  function draw(){
    if(isVideoRun){
      simpleThreshold()
    }
    requestAnimationFrame( draw )
  }

  start()


  /**
   * ストリームのコントロール
   */
  const stopBtn = document.getElementById('stop')
  const frontBtn = document.getElementById('front')
  const rearBtn = document.getElementById('rear')

  let ua = navigator.userAgent
  if(ua.indexOf('iPhone') < 0 && ua.indexOf('Android') < 0 && ua.indexOf('Mobile') < 0 && ua.indexOf('iPad') < 0){
    frontBtn.disabled = true
    rearBtn.disabled = true
  }

  stopBtn.addEventListener('click', () => {
    if(isVideoRun){
      stop()
      stopBtn.textContent = 'START'
    }else{
      start()
      stopBtn.textContent = 'STOP'
    }
    isVideoRun = !isVideoRun
  }, false)

  frontBtn.addEventListener('click', () => {
    stop()
    constraints.video.facingMode = 'user'
    setTimeout( () => {
      start()
    }, 500)
  }, false)

  rearBtn.addEventListener('click', () => {
    stop()
    constraints.video.facingMode = 'environment'
    setTimeout( () => {
      start()
    }, 500)
  }, false)


  /**
   * 顔の認識
   */
  const threshold = document.getElementById('threshold')
  const thresholdChecked = document.getElementById('threshold_flg')

  function simpleThreshold(){
    ctx.drawImage(video, 0, 0)

    if(!thresholdChecked.checked) return
    let src = ctx.getImageData(0, 0, canvas.width, canvas.height)
    let dst = ctx.createImageData(canvas.width, canvas.height)

    let isWhite = 0

    for(let i = 0; i < src.data.length; i = i + 4){
      let y = ~~(0.299 * src.data[i] + 0.587 * src.data[i + 1] + 0.114 * src.data[i + 2])
      let ret = (y > threshold.value) ? 255: 0
      dst.data[i] = dst.data[i + 1] = dst.data[i + 2] = ret
      dst.data[i + 3] = src.data[i + 3]

      isWhite += ret === 255? 1: 0 
    }
    ctx.putImageData(dst, 0, 0)

    if(!isAudioRun) return
    const total = canvas.width * canvas.height;
    oscillator.frequency.value = BASE_FREQUENCY + ((isWhite / total) - 0.5) * 300
    // console.log(oscillator.frequency.value)
  }


  startBtn.addEventListener('click', () => {
    if(!isAudioRun){
      isAudioRun = true
      // オーディオ再生
      oscillator.start()
      gain.gain.value = 0
    }

    if(isMuted){
      gain.gain.value = 1
      startBtn.textContent = 'AUDIO STOP'
    }else{
      gain.gain.value = 0
      startBtn.textContent = 'AUDIO START'
    }
    isMuted = !isMuted
  }, false)

})()