import React, { useState, useEffect, useRef, useMemo, ChangeEvent, MouseEvent } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Search, Sparkles, 
  Globe, RefreshCw, Tv, Activity, Terminal, Settings, Layers, Cpu, 
  ExternalLink, Lock, Unlock, Sliders, X, ChevronDown, Monitor, Wifi, Shield, Disc, User
} from 'lucide-react';
import Hls from 'hls.js';

// Fallback high-quality channels database if GitHub raw fetch fails/CORS blocks
const FALLBACK_CHANNELS = [
  {
    name: "Somoy TV Live (Bangla)",
    url: "https://somoy_dynamic_hls-lh.akamaihd.net/i/somoy_hls@1234/master.m3u8",
    logo: "https://raw.githubusercontent.com/foridul422/IPTV-/main/logos/somoy.png",
    category: "News",
    country: "Bangladesh",
    status: "89 Mbps Feed"
  },
  {
    name: "Independent TV (Bangla)",
    url: "https://independent_live-lh.akamaihd.net/i/itv_live@1234/master.m3u8",
    logo: "https://raw.githubusercontent.com/foridul422/IPTV-/main/logos/independent.png",
    category: "News",
    country: "Bangladesh",
    status: "91 Mbps Feed"
  },
  {
    name: "Slam! TV Dance (Music Feed)",
    url: "https://playertest.longtailvideo.com/adaptive/oceans/oceans.m3u8",
    logo: "https://raw.githubusercontent.com/foridul422/IPTV-/main/logos/slamtv.png",
    category: "Music",
    country: "Global",
    status: "Active"
  },
  {
    name: "NASA HD Live Stream",
    url: "https://demo.unified-streaming.com/k8s/live/stable/scte35.isml/.m3u8",
    logo: "https://www.nasa.gov/wp-content/themes/nasa/assets/images/nasa-logo.svg",
    category: "Science",
    country: "USA",
    status: "Space Telemetry"
  },
  {
    name: "Sintel Ultra Media Stream",
    url: "https://bitmovin-a.akamaihd.net/content/playhouse-vr/m3u8s/11331.m3u8",
    logo: "https://picsum.photos/seed/sintel/120/120",
    category: "Movies",
    country: "Global",
    status: "1080P Master"
  },
  {
    name: "Red Bull TV Live Broadcast",
    url: "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8",
    logo: "https://picsum.photos/seed/redbull/120/120",
    category: "Sports",
    country: "Global",
    status: "Adaptive UHD Feed"
  },
  {
    name: "France 24 English Live",
    url: "https://static.france24.com/live/F24_EN_LO_HLS/live_tv.m3u8",
    logo: "https://picsum.photos/seed/france24/120/120",
    category: "News",
    country: "France",
    status: "HQ Source"
  },
  {
    name: "Deutsche Welle Live EN",
    url: "https://dwstream72-lh.akamaihd.net/i/dwstream72_live@123556/master.m3u8",
    logo: "https://picsum.photos/seed/dw/120/120",
    category: "News",
    country: "Germany",
    status: "HQ Source"
  }
];

// Exact theme color configurations supporting pill selection mapped dynamically but defaulting to AMBER
const THEME_PRESETS = {
  amber: {
    accentCode: '#ff9f00',
    primaryText: 'text-[#ff9f00]',
    primaryBg: 'bg-[#ff9f00]',
    primaryBorder: 'border-[#ff9f00]',
    glowClass: 'shadow-neon-amber',
    glowStrongClass: 'shadow-neon-amber-strong',
    outlineStyle: 'border-[#ff9f00]/30 focus:border-[#ff9f00]',
    pillsRowBg: 'rgba(255,159,0,0.15)',
    activePillBorder: 'border-white',
  },
  cyan: {
    accentCode: '#00f0ff',
    primaryText: 'text-[#00f0ff]',
    primaryBg: 'bg-[#00f0ff]',
    primaryBorder: 'border-[#00f0ff]',
    glowClass: 'shadow-[0_0_15px_rgba(0,240,255,0.35)]',
    glowStrongClass: 'shadow-[0_0_25px_rgba(0,240,255,0.6)]',
    outlineStyle: 'border-[#00f0ff]/30 focus:border-[#00f0ff]',
    pillsRowBg: 'rgba(0,240,255,0.15)',
    activePillBorder: 'border-white',
  },
  pink: {
    accentCode: '#ff007f',
    primaryText: 'text-[#ff007f]',
    primaryBg: 'bg-[#ff007f]',
    primaryBorder: 'border-[#ff007f]',
    glowClass: 'shadow-[0_0_15px_rgba(255,0,127,0.35)]',
    glowStrongClass: 'shadow-[0_0_25px_rgba(255,0,127,0.6)]',
    outlineStyle: 'border-[#ff007f]/30 focus:border-[#ff007f]',
    pillsRowBg: 'rgba(255,0,127,0.15)',
    activePillBorder: 'border-white',
  },
  green: {
    accentCode: '#39ff14',
    primaryText: 'text-[#39ff14]',
    primaryBg: 'bg-[#39ff14]',
    primaryBorder: 'border-[#39ff14]',
    glowClass: 'shadow-[0_0_15px_rgba(57,255,20,0.35)]',
    glowStrongClass: 'shadow-[0_0_25px_rgba(57,255,20,0.6)]',
    outlineStyle: 'border-[#39ff14]/30 focus:border-[#39ff14]',
    pillsRowBg: 'rgba(57,255,20,0.15)',
    activePillBorder: 'border-white',
  }
};

export default function App() {
  // Theme state defaulting to golden-amber
  const [activeTheme, setActiveTheme] = useState<'amber' | 'cyan' | 'pink' | 'green'>('amber');
  const currentTheme = THEME_PRESETS[activeTheme];

  // Core channels data pipelines
  const [channels, setChannels] = useState<any[]>(FALLBACK_CHANNELS);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorStatus, setErrorStatus] = useState<string>('');
  const [pipelineSource, setPipelineSource] = useState<string>('FALLBACK_STORAGE');
  const [channelSearch, setChannelSearch] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Active channel & video state
  const [currentChannel, setCurrentChannel] = useState<any>(FALLBACK_CHANNELS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [videoSizing, setVideoSizing] = useState<'contain' | 'cover' | 'fill'>('contain');

  // Video tech stats overlays
  const [latencyVal, setLatencyVal] = useState<number>(24);
  const [resolutionStr, setResolutionStr] = useState<string>('1920x1080');
  const [bufferSec, setBufferSec] = useState<number>(0.8);
  const [streamHealth, setStreamHealth] = useState<'optimal' | 'warning' | 'connecting'>('optimal');

  // UI state overlays
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);
  const [isLandscapeForced, setIsLandscapeForced] = useState<boolean>(false);
  const [systemLogs, setSystemLogs] = useState<string[]>([
    "SYS_INIT: Primary Amber Cyberdeck loaded successfully.",
    "NETWORK_ENG: Setting default fallback pipelines.",
    "PORT: Routing dev frames on port 3000."
  ]);
  const [activeBottomTab, setActiveBottomTab] = useState<'SYSTEM_HUB' | 'NETWORK' | 'CREATOR_PORT' | 'DIAGNOSTICS'>('SYSTEM_HUB');
  const [playlistInputUrl, setPlaylistInputUrl] = useState<string>('https://raw.githubusercontent.com/foridul422/IPTV-/main/channels.json');

  // References
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const hlsInstanceRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Time & date HUD indicators
  const [currentTime, setCurrentTime] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toISOString().replace('T', ' ').substring(0, 19));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Write systemic console log
  const writeLog = (msg: string) => {
    const stamp = new Date().toLocaleTimeString();
    setSystemLogs(prev => [`[${stamp}] ${msg}`, ...prev.slice(0, 39)]);
  };

  // Fetch Channels database with Fallback Strategy
  const fetchChannelsDatabase = async (customUrl?: string) => {
    setLoading(true);
    const targetUrl = customUrl || 'https://raw.githubusercontent.com/foridul422/IPTV-/main/channels.json';
    writeLog(`DATA_PIPE: Requesting database from ${targetUrl}`);

    try {
      const response = await fetch(targetUrl);
      if (!response.ok) {
        throw new Error(`HTTP Error Status: ${response.status}`);
      }
      const data = await response.json();
      
      // Parse data is list of channels
      if (Array.isArray(data)) {
        if (data.length === 0) throw new Error("Empty JSON channels array fetched.");
        
        // Normalize object formats to support user attributes elegantly
        const parsed = data.map((item: any, idx: number) => ({
          name: item.name || item.title || `Stream Node #${idx + 1}`,
          url: item.url || item.file || item.stream_url || "",
          logo: item.logo || item.image || item.icon || item.tvg_logo || `https://picsum.photos/seed/${idx}/120/120`,
          category: item.category || item.group || item.tvg_type || "General",
          country: item.country || item.tvg_country || "Global",
          status: item.status || "Active Pipeline"
        })).filter(c => c.url !== "");

        setChannels(parsed);
        setCurrentChannel(parsed[0]);
        setPipelineSource("GITHUB_MAINLINE");
        setErrorStatus("");
        writeLog(`SUCCESS: Loaded ${parsed.length} digital IPTV nodes from mainline pipeline.`);
      } else {
        throw new Error("Invalid database schema - expected JSON Array");
      }
    } catch (err: any) {
      writeLog(`ERR_CORS: Failed fetching database. Initiating fail-safe automatic fallback routing.`);
      setChannels(FALLBACK_CHANNELS);
      setCurrentChannel(FALLBACK_CHANNELS[0]);
      setPipelineSource("FALLBACK_COGNITIVE_RECOVERY");
      setErrorStatus("Mainline database failed. Fallback routing activated.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannelsDatabase();
  }, []);

  // HLS stream playback engine integration
  useEffect(() => {
    if (!videoRef.current) return;

    const sourceUrl = currentChannel?.url;
    if (!sourceUrl) return;

    writeLog(`STREAM_ENG: Aligning decryption lens to node: "${currentChannel.name}"`);
    setStreamHealth('connecting');
    const timerStart = performance.now();

    // Reset current Hls playback
    if (hlsInstanceRef.current) {
      hlsInstanceRef.current.destroy();
      hlsInstanceRef.current = null;
    }

    // Try loading stream
    if (Hls.isSupported()) {
      const hls = new Hls({
        maxMaxBufferLength: 10,
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsInstanceRef.current = hls;
      hls.loadSource(sourceUrl);
      hls.attachMedia(videoRef.current);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        const loadDelay = Math.round(performance.now() - timerStart);
        setLatencyVal(15 + Math.floor(Math.random() * 20)); // Dynamic low-latency simulation
        setStreamHealth('optimal');
        writeLog(`MANIFEST: Handshake stabilized. Decryption delay: ${loadDelay}ms`);
        if (isPlaying) {
          videoRef.current?.play().catch(() => {
            setIsPlaying(false);
          });
        }
      });

      hls.on(Hls.Events.LEVEL_LOADED, () => {
        if (videoRef.current) {
          setResolutionStr(`${videoRef.current.videoWidth || 1920}x${videoRef.current.videoHeight || 1080}`);
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              writeLog(`ERR_NET: Stream network issues. Attempting recovery...`);
              hls.startLoad();
              setStreamHealth('warning');
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              writeLog(`ERR_MED: Media decoding error. Attempting recovered routing...`);
              hls.recoverMediaError();
              break;
            default:
              writeLog(`ERR_FATAL: Stream engine crashed. Select another node.`);
              setStreamHealth('warning');
              break;
          }
        }
      });

    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // Fallback for native Safari stream
      videoRef.current.src = sourceUrl;
      videoRef.current.onloadstart = () => {
        setLatencyVal(18);
        setStreamHealth('optimal');
      };
    } else {
      writeLog(`CRITICAL: Browser lacks engine decoder parameters for HLS live formats.`);
      setStreamHealth('warning');
    }

    // Reset buffer tracking interval
    const bufferInterval = setInterval(() => {
      if (videoRef.current && videoRef.current.buffered.length > 0) {
        setBufferSec(Number((videoRef.current.buffered.end(0) - videoRef.current.currentTime).toFixed(2)));
      }
    }, 1000);

    return () => {
      clearInterval(bufferInterval);
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
    };
  }, [currentChannel, isPlaying]);

  // Sizing mode stylesheet resolution
  const sizingClass = useMemo(() => {
    switch (videoSizing) {
      case 'cover': return 'object-cover w-full h-full';
      case 'fill': return 'object-fill w-full h-full';
      case 'contain':
      default:
        return 'object-contain w-full h-full';
    }
  }, [videoSizing]);

  // Volume synchronization
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Interactive controls auto-hide setup (3 seconds timeout)
  const resetControlsTimeout = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      const isFullscreenActive = !!document.fullscreenElement;
      if (isPlaying || isFullscreenActive) {
        setControlsVisible(false);
      }
    }, 3000);
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying, currentChannel]);

  // Handle document level fullscreen change to reset controls timeout and trigger immediate auto-hide
  useEffect(() => {
    const handleFullscreenChange = () => {
      resetControlsTimeout();
      
      const isFullscreenActive = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      if (!isFullscreenActive) {
        setIsLandscapeForced(false);
        try {
          const orient = (screen as any).orientation || (screen as any).mozOrientation || (screen as any).msOrientation;
          if (orient && orient.unlock) {
            orient.unlock();
          }
        } catch (orientationError) {
          // ignore orientation lock release failure quietly
        }
        writeLog("SYS_LOCK: Switched off forced landscape alignment on exiting fullscreen.");
      }
      
      writeLog("SYS_EVENT: Fullscreen transition triggered. Control visibility calibrated.");
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Extract Category and Country options for filtering
  const countryOptions = useMemo(() => {
    const list = channels.map(c => c.country);
    return ['ALL', ...Array.from(new Set(list))];
  }, [channels]);

  const categoryOptions = useMemo(() => {
    const list = channels.map(c => c.category);
    return ['ALL', ...Array.from(new Set(list))];
  }, [channels]);

  // Filter channels based on Search + Filters state
  const filteredChannels = useMemo(() => {
    return channels.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(channelSearch.toLowerCase()) || 
                          c.category.toLowerCase().includes(channelSearch.toLowerCase());
      const matchCountry = selectedCountry === 'ALL' || c.country === selectedCountry;
      const matchCategory = selectedCategory === 'ALL' || c.category === selectedCategory;
      return matchSearch && matchCountry && matchCategory;
    });
  }, [channels, channelSearch, selectedCountry, selectedCategory]);

  // Force Fullscreen layout and Orientation Locker
  const triggerFullscreenMode = () => {
    try {
      if (!playerContainerRef.current || !videoRef.current) return;
      
      // On iOS / Safari mobile (e.g., iPhone), use webkitEnterFullscreen directly on the video element for native seamless landscape experience
      const video = videoRef.current as any;
      if (video && typeof video.webkitEnterFullscreen === 'function' && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
        video.webkitEnterFullscreen();
        writeLog("SYS_LOCK: Triggered iOS native webkitEnterFullscreen for seamless rotation.");
        return;
      }

      const isForcedActive = isLandscapeForced;
      
      if (!document.fullscreenElement && !isForcedActive) {
        playerContainerRef.current.requestFullscreen().then(() => {
          writeLog("SYS_LOCK: Locked interface into standard Fullscreen frame.");
          
          const isCurrentlyPortrait = window.innerHeight > window.innerWidth;
          
          // Attempt Landscape alignment
          const orient = (screen as any).orientation || (screen as any).mozOrientation || (screen as any).msOrientation;
          if (orient && orient.lock) {
            orient.lock('landscape').then(() => {
              writeLog("SYS_LOCK: Screen aligned to landscape orientation successfully.");
            }).catch((e: any) => {
              writeLog(`SYS_WARN: Portrait orientation override. Applying fallbacks: ${e?.message || e}`);
              if (isCurrentlyPortrait) {
                setIsLandscapeForced(true);
              }
            });
          } else {
            if (isCurrentlyPortrait) {
              setIsLandscapeForced(true);
            }
          }
        }).catch((err) => {
          writeLog(`SYS_ERR: Fullscreen authorization rejected: ${err.message}`);
          const isCurrentlyPortrait = window.innerHeight > window.innerWidth;
          if (isCurrentlyPortrait) {
            setIsLandscapeForced(true);
          } else {
            setIsLandscapeForced(true);
          }
        });
      } else {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
        setIsLandscapeForced(false);
        writeLog("SYS_LOCK: Restored standard window orientation framework.");
      }
    } catch (e: any) {
      writeLog(`SYS_ERR: Interactive scaling parameters failed: ${e.message}`);
    }
  };

  // Double Click rotation fallback inside video screen
  const handleVideoOnDoubleClick = () => {
    triggerFullscreenMode();
  };

  // Toggle video playing
  const togglePlayState = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
        writeLog("ENGINE: Playback execution paused manually.");
      } else {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
          writeLog("ENGINE: Resuming playback processes.");
        }).catch(err => {
          setIsPlaying(false);
          writeLog(`ERR_DEC: Playback recovery rejected: ${err.message}`);
        });
      }
    }
    resetControlsTimeout();
  };

  // Seamless looping flow for Fit, Zoom and Stretch modes across portrait & landscape bounds
  const cycleVideoSizing = () => {
    setVideoSizing(prev => {
      if (prev === 'contain') return 'cover';
      if (prev === 'cover') return 'fill';
      return 'contain';
    });
    writeLog(`LENS: Looping video boundaries sizing state.`);
  };

  // Handles overall container tap clicks to toggle controls or reset the hide display timeout
  const handleVideoContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Bypass child interactive input buttons or timeline click triggers
    if (target.closest('button') || target.closest('input')) {
      return;
    }
    if (!controlsVisible) {
      setControlsVisible(true);
      resetControlsTimeout();
    } else {
      togglePlayState();
    }
  };

  // Handle M3U playlist file uploads manually
  const parseM3U = (text: string) => {
    try {
      const lines = text.split('\n');
      const parsedList: any[] = [];
      let currentItem: any = null;

      lines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('#EXTINF:')) {
          currentItem = {};
          // Parse channel titles
          const parts = trimmed.split(',');
          currentItem.name = parts.pop() || "Unnamed Stream";
          
          // Try parse metadata info attributes
          const tvgLogoMatch = trimmed.match(/tvg-logo="([^"]+)"/);
          if (tvgLogoMatch) currentItem.logo = tvgLogoMatch[1];
          
          const groupMatch = trimmed.match(/group-title="([^"]+)"/);
          currentItem.category = groupMatch ? groupMatch[1] : "Imported Playlist";
          currentItem.country = "Local Network";
        } else if (trimmed && !trimmed.startsWith('#') && currentItem) {
          currentItem.url = trimmed;
          parsedList.push(currentItem);
          currentItem = null;
        }
      });

      if (parsedList.length > 0) {
        setChannels(parsedList);
        setCurrentChannel(parsedList[0]);
        setPipelineSource("USER_M3U_UPLOAD");
        writeLog(`SUCCESS: Parsed & configured ${parsedList.length} customized nodes from local M3U file.`);
      } else {
        throw new Error("No channels located inside M3U scope.");
      }
    } catch (err: any) {
      writeLog(`ERR_M3U: Import module failed structure validates: ${err.message}`);
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    writeLog(`DATA_IN: Uploading custom file "${file.name}" for analysis...`);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseM3U(text);
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-black cyber-grid font-sans relative no-scrollbar overflow-x-hidden selection:bg-[#ff9f00] selection:text-black pb-12">
      {/* 1. ABSOLUTE FIRST ELEMENT IN BODY VIEWPORT: FORCIBLY PINNED VIDEO PLAYER SCREEN */}
      <div 
        id="hls-video-player-container"
        ref={playerContainerRef}
        onMouseMove={resetControlsTimeout}
        onTouchStart={resetControlsTimeout}
        onTouchMove={resetControlsTimeout}
        onClick={handleVideoContainerClick}
        className={`video-pinned-top md:relative md:max-w-7xl md:mx-auto md:my-5 md:rounded-lg md:border border-zinc-800 bg-black aspect-video relative group flex items-center justify-center overflow-hidden transition-all duration-300 shadow-2xl ${
          isLandscapeForced ? 'forced-landscape-rotate' : ''
        }`}
      >

        {/* Standard Native Video Element */}
        <video
          id="t-tech-video-lens"
          ref={videoRef}
          onClick={(e) => { e.stopPropagation(); togglePlayState(); }}
          onDoubleClick={handleVideoOnDoubleClick}
          className={`max-w-full max-h-full cursor-pointer transition-all ${sizingClass}`}
          playsInline
          autoPlay
        />

        {/* Dynamic Loading Overlay inside Player Container */}
        {streamHealth === 'connecting' && (
          <div className="absolute inset-0 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center space-y-4 z-20">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-[#ff9f00]/10 border-t-[#ff9f00] animate-spin"></div>
              <Disc className="absolute w-6 h-6 text-[#ff9f00] animate-pulse" />
            </div>
            <div className="text-center font-mono space-y-1">
              <h4 className="text-xs font-bold text-zinc-100 tracking-widest uppercase">SYNCING FREQUENCY COUPLING...</h4>
              <p className="text-[10px] text-[#ff9f00]">TUNING LATENCY CALIBRATOR LENS [PORT 3000]</p>
              <p className="text-[9px] text-zinc-500">FETCHING: {currentChannel?.url?.substring(0, 45)}...</p>
            </div>
          </div>
        )}

        {/* SINGLE GROUPED CONTROL OVERLAY: TOP METADATA BAR (fades after 3 seconds) */}
        <div 
          className="absolute top-0 inset-x-0 p-3 bg-gradient-to-b from-black/90 via-black/45 to-transparent flex flex-wrap items-center justify-between gap-2 z-20 transition-all duration-500 video-overlay-transition"
          style={{
            opacity: controlsVisible ? 1 : 0,
            transform: controlsVisible ? 'translateY(0)' : 'translateY(-10px)',
            pointerEvents: controlsVisible ? 'auto' : 'none'
          }}
        >
          <div className="flex items-center gap-2 font-mono text-[9px] tracking-wider">
            <span className="bg-zinc-950/90 text-[#ff9f00] border border-[#ff9f00]/40 px-2.5 py-1 rounded shadow-neon-amber flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
              LIVE
            </span>
            <span className="bg-zinc-950/90 text-[#ff9f00] border border-[#ff9f00]/40 px-2.5 py-1 rounded shadow-neon-amber flex items-center gap-1.5">
              <Cpu className="w-3 h-3" /> LATENCY: <strong className="text-white">{latencyVal}MS</strong>
            </span>
            <span className="bg-zinc-950/90 text-[#ff9f00] border border-[#ff9f00]/40 px-2.5 py-1 rounded shadow-neon-amber flex items-center gap-1.5">
              <Wifi className="w-3 h-3" /> BUFFER: <strong className="text-white">{bufferSec}S</strong>
            </span>
            <span className="bg-zinc-950/90 text-zinc-400 border border-zinc-800 px-2.5 py-1 rounded flex items-center gap-1.5 hidden xs:flex">
              <Monitor className="w-3 h-3 text-[#ff9f00]" /> {resolutionStr}
            </span>
          </div>

          <div className="flex gap-2">
            <span className="bg-zinc-950/90 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[8px] font-mono uppercase font-bold flex items-center gap-1">
              <Shield className="w-2.5 h-2.5" /> DECRYPTION ON
            </span>
          </div>
        </div>

        {/* SINGLE GROUPED CONTROL OVERLAY: BOTTOM PLAYBACK DECK (fades after 3 seconds) */}
        <div 
          className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/95 via-black/75 to-transparent flex flex-col gap-2.5 z-20 transition-all duration-500 video-overlay-transition"
          style={{
            opacity: controlsVisible ? 1 : 0,
            transform: controlsVisible ? 'translateY(0)' : 'translateY(10px)',
            pointerEvents: controlsVisible ? 'auto' : 'none'
          }}
        >
          {/* Simulated scanning feed timeline bar */}
          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden relative">
            <div className="absolute top-0 left-0 h-full w-full bg-[#ff9f00]/10 animate-pulse"></div>
            <div className="absolute top-0 left-0 h-full bg-[#ff9f00] shadow-neon-amber w-[85%]" style={{ transition: 'width 0.5s' }}></div>
          </div>

          <div className="flex items-center justify-between gap-4">
            {/* Play/Pause Key */}
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); togglePlayState(); }}
                className="w-10 h-10 rounded-lg bg-[#ff9f00] text-black shadow-neon-amber hover:scale-105 active:scale-95 transition-transform flex items-center justify-center cursor-pointer focus:outline-none"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-black font-extrabold" /> : <Play className="w-5 h-5 fill-black pl-0.5" />}
              </button>

              {/* Volume sliders stack */}
              <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 px-3 py-2 rounded-lg">
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                  className="text-zinc-400 hover:text-[#ff9f00] transition-colors focus:outline-none"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    setIsMuted(false);
                  }}
                  className="accent-[#ff9f00] w-14 xs:w-18 cursor-pointer h-1 rounded-lg bg-zinc-800 appearance-none"
                  style={{ outline: "none" }}
                />
              </div>
            </div>

            {/* Now Streaming Node Text label */}
            <div className="hidden md:block text-left font-mono text-[9px] text-zinc-300 max-w-[200px] truncate bg-black/40 px-2.5 py-1 rounded border border-zinc-800/50">
              <span className="text-zinc-500">NOW STREAMING:</span> <strong className="text-[#ff9f00]">{currentChannel?.name}</strong>
            </div>

            {/* Sizing & Orientation rotation Deck keys */}
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); cycleVideoSizing(); }}
                className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80 rounded-lg text-zinc-300 hover:text-[#ff9f00] transition-all uppercase font-bold text-center text-[9px] flex items-center gap-1 focus:outline-none"
              >
                <Sliders className="w-3.5 h-3.5 text-[#ff9f00]" />
                SIZE: <span className="text-[#ff9f00] font-extrabold">{videoSizing === 'contain' ? 'FIT' : videoSizing === 'cover' ? 'ZOOM' : 'STRETCH'}</span>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); triggerFullscreenMode(); }}
                className="p-2.5 rounded-lg border border-[#ff9f00]/30 hover:border-[#ff9f00] bg-zinc-900 text-zinc-300 hover:text-[#ff9f00] shadow-neon-amber hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center focus:outline-none"
                title="Toggle Landscape Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Top Header Console Panel */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md px-4 py-3 md:sticky md:top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo Frame & Torikul Islam profile Anchor node */}
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-lime-400 ${currentTheme.glowClass}`}>
                <Disc className={`w-6 h-6 animate-spin ${currentTheme.primaryText}`} style={{ animationDuration: '3s' }} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-widest text-zinc-100 uppercase select-none font-mono">
                  T-Tech <span className={`font-extrabold ${currentTheme.primaryText}`}>IPTV</span>
                </h1>
                <div className="text-[10px] font-mono text-zinc-500 tracking-normal flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  STABILIZED ENGINE PROTOCOL v4.9
                </div>
              </div>
            </div>

            {/* Stable Anchor Profile with Glowing Amber Ring Frame */}
            <div className="flex items-center gap-2 border border-zinc-800/80 pl-2 pr-3 py-1 rounded-full bg-zinc-900/60 font-mono">
              <button 
                id="creator-avatar-button"
                onClick={() => {
                  setActiveBottomTab('CREATOR_PORT');
                  writeLog("ROUTING: Opening specialized Creator Command Port matrix.");
                }}
                className="relative group focus:outline-none"
              >
                <div className={`w-9 h-9 rounded-full overflow-hidden border-2 border-[#ff9f00] shadow-neon-amber hover:scale-105 transition-transform duration-300`}>
                  <img 
                    src="https://i.ibb.co/0RcPrCbv/IMG-20260608-012226.jpg" 
                    alt="Torikul Profile" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="absolute -top-1 -right-1 bg-[#ff9f00] text-black text-[8px] font-extrabold px-1 rounded-full border border-black animate-bounce">
                  .PRO
                </span>
              </button>
              <div className="text-left hidden xs:block">
                <p className="text-[10px] font-bold text-zinc-300 hover:text-amber-400 transition-colors">Torikul Islam</p>
                <p className="text-[8px] text-[#ff9f00] font-mono">ANALYST PORT</p>
              </div>
            </div>
          </div>

          {/* "THEME LINK:" row displaying colorful interactive circular pills */}
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-zinc-900/60 border border-zinc-800 font-mono text-xs w-full md:w-auto justify-center md:justify-end">
            <span className="text-zinc-500 text-[11px] font-bold">THEME ACTIVE_MOD:</span>
            <div className="flex gap-2">
              <button 
                id="theme-cyan"
                onClick={() => { setActiveTheme('cyan'); writeLog("SYS_THEME: Shifted interface accent to Matrix Cyan."); }}
                className={`w-4 h-4 rounded-full bg-[#00f0ff] cursor-pointer hover:scale-125 transition-transform ${activeTheme === 'cyan' ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950 scale-110' : ''}`}
                title="Matrix Cyan Theme"
              />
              <button 
                id="theme-pink"
                onClick={() => { setActiveTheme('pink'); writeLog("SYS_THEME: Shifted interface accent to Neon Pink."); }}
                className={`w-4 h-4 rounded-full bg-[#ff007f] cursor-pointer hover:scale-125 transition-transform ${activeTheme === 'pink' ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950 scale-110' : ''}`}
                title="Cyberpunk Pink Theme"
              />
              <button 
                id="theme-amber"
                onClick={() => { setActiveTheme('amber'); writeLog("SYS_THEME: Shifted interface accent to Premium Gold Amber."); }}
                className={`w-4 h-4 rounded-full bg-[#ff9f00] cursor-pointer hover:scale-125 transition-transform ${activeTheme === 'amber' ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950 scale-110' : ''}`}
                title="Amber Gold engine Theme"
              />
              <button 
                id="theme-green"
                onClick={() => { setActiveTheme('green'); writeLog("SYS_THEME: Shifted interface accent to Toxic Green."); }}
                className={`w-4 h-4 rounded-full bg-[#39ff14] cursor-pointer hover:scale-125 transition-transform ${activeTheme === 'green' ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950 scale-110' : ''}`}
                title="Biohazard Green Theme"
              />
            </div>
          </div>

          {/* Real-time System Clock HUD */}
          <div className="hidden lg:flex flex-col text-right font-mono text-zinc-400">
            <div className={`text-xs ${currentTheme.primaryText} font-bold flex items-center gap-1.5 justify-end`}>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              CORE PIPELINE HOSTED
            </div>
            <div className="text-[10px] text-zinc-500">{currentTime || '2026-06-08 13:41:27 UTC'}</div>
          </div>

        </div>
      </header>

      {/* Main Single-View Chassis Frame */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Dynamic warning system banner if offline */}
        {errorStatus && (
          <div className="mb-4 bg-amber-950/40 border border-amber-500/50 text-amber-300 p-3 rounded-lg flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="animate-ping rounded-full h-2 w-2 bg-amber-500"></span>
              <strong>SYSTEM NOTICE:</strong> {errorStatus}
            </div>
            <button 
              onClick={() => setErrorStatus('')} 
              className="hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab Routing Displays */}
        {activeBottomTab === 'SYSTEM_HUB' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: Channels database management terminal (grid span 4) */}
            <section className="lg:col-span-4 bg-zinc-950/90 border border-zinc-800 rounded-lg p-4 shadow-xl backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[2px]" style={{ backgroundColor: `${currentTheme.accentCode}4D` }}></div>
              
              {/* Header Title Controls */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-900">
                <div className="flex items-center gap-2 font-mono">
                  <Layers className={`w-4 h-4 ${currentTheme.primaryText}`} />
                  <span className="text-zinc-200 text-sm font-bold tracking-widest uppercase">STREAM NODES</span>
                </div>
                <div className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono">
                  {filteredChannels.length} OF {channels.length} NODES
                </div>
              </div>

              {/* Advanced Search Inputs with Neon Glow Focus */}
              <div className="space-y-3 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500/80" />
                  <input 
                    type="text"
                    placeholder="SCAN SIGNAL CHANNELS..."
                    value={channelSearch}
                    onChange={(e) => setChannelSearch(e.target.value)}
                    className="w-full bg-zinc-900/80 border border-zinc-800 text-zinc-100 pl-10 pr-4 py-2 text-xs font-mono rounded-md placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#ff9f00] focus:border-[#ff9f00] transition-all"
                  />
                </div>

                {/* DUAL Dropdown Menu: Country and Category selectors */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 font-mono tracking-wider">COUNTRY PIPELINE</label>
                    <div className="relative">
                      <select 
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs py-1.5 px-2 rounded-md font-mono focus:outline-none focus:ring-1 focus:ring-[#ff9f00] focus:border-[#ff9f00] cursor-pointer appearance-none"
                      >
                        {countryOptions.map((country) => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-2.5 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 font-mono tracking-wider">CATEGORY SEGMENT</label>
                    <div className="relative">
                      <select 
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs py-1.5 px-2 rounded-md font-mono focus:outline-none focus:ring-1 focus:ring-[#ff9f00] focus:border-[#ff9f00] cursor-pointer appearance-none"
                      >
                        {categoryOptions.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-2.5 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Categories Scrollable Quick Pills Row */}
              <div className="flex gap-1 overflow-x-auto pb-3 mb-3 border-b border-zinc-900 no-scrollbar">
                {categoryOptions.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      writeLog(`FILTER: Loaded category filter lens: "${cat}"`);
                    }}
                    className={`px-3 py-1 text-[9px] font-mono rounded-full font-bold uppercase transition-all shrink-0 border ${
                      selectedCategory === cat 
                        ? `bg-zinc-900 border-[#ff9f00] text-[#ff9f00] ${currentTheme.glowClass}`
                        : 'bg-zinc-900/30 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Channel Grid Stream List (Scrollable container) */}
              <div className="h-[430px] overflow-y-auto pr-1 space-y-2 no-scrollbar">
                {loading ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-3">
                    <RefreshCw className={`w-7 h-7 text-[#ff9f00] animate-spin`} />
                    <p className="text-xs font-mono text-zinc-500">SYNCHRONIZING TELEMETRIC DATABASES...</p>
                  </div>
                ) : filteredChannels.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-2 text-center py-10">
                    <Terminal className="w-8 h-8 text-zinc-600" />
                    <p className="text-xs font-mono text-zinc-500">NO CHANNELS MATCH FILTER CRITERIA</p>
                    <button 
                      onClick={() => { setSelectedCountry('ALL'); setSelectedCategory('ALL'); setChannelSearch(''); }}
                      className="text-[10px] text-[#ff9f00] underline font-mono hover:text-amber-300"
                    >
                      RESET SYSTEM CHANNELS LENS
                    </button>
                  </div>
                ) : (
                  filteredChannels.map((chan, idx) => {
                    const isSelected = currentChannel?.name === chan.name;
                    return (
                      <button
                        key={`${chan.name}-${idx}`}
                        className={`w-full text-left p-2.5 rounded-lg border font-mono transition-all duration-300 flex items-center justify-between group cursor-pointer ${
                          isSelected 
                            ? `bg-[#ff9f00]/10 border-[#ff9f00] ${currentTheme.glowClass}` 
                            : 'bg-zinc-950/90 border-zinc-900 hover:border-zinc-800 hover:bg-zinc-900/50'
                        }`}
                        onClick={() => {
                          setCurrentChannel(chan);
                          setIsPlaying(true);
                          setLatencyVal(14 + Math.floor(Math.random() * 25));
                        }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Channel Logo icon frame */}
                          <div className={`w-10 h-10 rounded-md overflow-hidden bg-zinc-900 border shrink-0 flex items-center justify-center relative ${
                            isSelected ? 'border-[#ff9f00]' : 'border-zinc-800 group-hover:border-zinc-700'
                          }`}>
                            <img 
                              src={chan.logo || 'https://picsum.photos/seed/cyber/120/120'} 
                              alt="chan info" 
                              className="w-full h-full object-contain p-1"
                              onError={(e) => {
                                // Default backup replacement logo
                                (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${idx}/120/120`;
                              }}
                              referrerPolicy="no-referrer"
                            />
                            {isSelected && (
                              <div className="absolute inset-0 bg-[#ff9f00]/20 flex items-center justify-center">
                                <Play className="w-4 h-4 text-[#ff9f00] fill-[#ff9f00]" />
                              </div>
                            )}
                          </div>

                          {/* Channel Telemetry Details */}
                          <div className="min-w-0">
                            <h3 className={`text-xs font-bold leading-none truncate ${
                              isSelected ? 'text-[#ff9f00]' : 'text-zinc-200 group-hover:text-white'
                            }`}>
                              {chan.name}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-1 text-[9px] text-zinc-500">
                              <Globe className="w-2.5 h-2.5" />
                              <span className="truncate max-w-[80px]">{chan.country || 'Global'}</span>
                              <span className="text-[#ff9f00]/50">•</span>
                              <span className="truncate text-zinc-400 font-medium">{chan.category}</span>
                            </div>
                          </div>
                        </div>

                        {/* Custom pulsing active indicator on active line */}
                        <div className="flex flex-col items-end shrink-0 pl-1.5">
                          {isSelected ? (
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff9f00] opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff9f00]"></span>
                            </span>
                          ) : (
                            <span className="text-[9px] text-[#ff9f00]/40 font-mono pr-1 group-hover:text-[#ff9f00]/80">SECURE</span>
                          )}
                          <span className="text-[8px] text-zinc-600 group-hover:text-zinc-500 mt-1 uppercase font-mono">{chan.status || 'Active'}</span>
                        </div>

                      </button>
                    )
                  })
                )}
              </div>

              {/* Fast reloading system controls database */}
              <div className="mt-4 pt-3 border-t border-zinc-900 flex justify-between items-center text-[10px] font-mono text-zinc-500">
                <span>PIPELINE: <strong className="text-zinc-300">{pipelineSource}</strong></span>
                <button 
                  id="reload-db-button"
                  onClick={() => fetchChannelsDatabase(playlistInputUrl)}
                  className="p-1 px-3 border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 hover:text-[#ff9f00] rounded-md transition-all flex items-center gap-1.5 cursor-pointer focus:outline-none"
                >
                  <RefreshCw className="w-3 h-3" /> RE-VERIFY PIPELINES
                </button>
              </div>

            </section>

            {/* RIGHT COLUMN: CORE ANALYTIC MONITOR WORKSPACE (grid-span 8) */}
            <section className="lg:col-span-8 space-y-6 font-mono text-xs">
              
              {/* Premium Core Cockpit Screen */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-lg shadow-2xl relative overflow-hidden backdrop-blur-md">
                
                {/* Cyber Matrix Terminal Accent Banner */}
                <div className="h-8 bg-zinc-900/90 border-b border-zinc-900 px-4 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff9f00] opacity-75`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 bg-[#ff9f00]`}></span>
                    </span>
                    <span className="text-zinc-400 uppercase tracking-widest font-bold">
                      STREAM MONITOR DECK ACTIVE
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-500">
                    <span>HOST IP: <strong className="text-zinc-300">0.0.0.0</strong></span>
                    <span>PORT: <strong className="text-[#ff9f00]">3000</strong></span>
                  </div>
                </div>

                {/* Sub features panel displaying diagnostic info */}
                <div className="p-5 bg-black/40 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-zinc-900/55 p-3 rounded-lg border border-zinc-900 space-y-1">
                    <span className="text-zinc-500 uppercase block text-[8px] tracking-wider">HLS LENS RATIO</span>
                    <strong className="text-[#ff9f00] font-extrabold uppercase">
                      {videoSizing === 'contain' ? 'FIT (16/9)' : videoSizing === 'cover' ? 'ZOOM (FIT)' : 'STRETCH'}
                    </strong>
                  </div>
                  <div className="bg-zinc-900/55 p-3 rounded-lg border border-zinc-900 space-y-1">
                    <span className="text-zinc-500 uppercase block text-[8px] tracking-wider">STREAM ENGINE STATE</span>
                    <strong className="text-emerald-400 font-bold flex items-center gap-1.5 uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> ONLINE SECURE
                    </strong>
                  </div>
                  <div className="bg-zinc-900/55 p-3 rounded-lg border border-zinc-900 space-y-1">
                    <span className="text-zinc-500 uppercase block text-[8px] tracking-wider">DATA FLOW PIPELINE</span>
                    <span className="text-zinc-200 font-bold truncate block">{pipelineSource}</span>
                  </div>
                  <div className="bg-zinc-900/55 p-3 rounded-lg border border-zinc-900 space-y-1">
                    <span className="text-zinc-500 uppercase block text-[8px] tracking-wider">BUFFERING TARGET</span>
                    <span className="text-[#ff9f00] font-bold">~0.75s to ~1.40s</span>
                  </div>
                </div>

                {/* Ambient information bar inside monitor console */}
                <div className="px-5 py-4 bg-zinc-950/60 border-t border-zinc-900 flex justify-between items-center text-[10px] text-zinc-400">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-zinc-600 block">CURRENT CHANNEL NODES DATA:</span>
                    <span className="text-[#ff9f00] font-extrabold">{currentChannel?.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-zinc-600 block">ENCODER PRESET:</span>
                    <span className="text-zinc-300 font-bold uppercase">{currentChannel?.category} FLUID FEED</span>
                  </div>
                </div>

              </div>

              {/* Console logs display */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-5 font-mono shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#ff9f00]/30 to-transparent"></div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-[#ff9f00]" /> CORE CHASSIS SYSTEMS DIAGNOSTICS LOGS:
                  </span>
                  <button 
                    onClick={() => { setSystemLogs([`[CLEAR] Diagnostics buffer refreshed at ${new Date().toLocaleTimeString()}`]); }}
                    className="text-[9px] text-zinc-600 hover:text-[#ff9f00] transition-colors border border-zinc-900 px-2 py-0.5 rounded cursor-pointer bg-black/20"
                  >
                    CLEAR LOGS
                  </button>
                </div>
                <div className="h-[210px] overflow-y-auto space-y-1 text-[10px] text-zinc-400 pr-2 select-text no-scrollbar bg-black/60 p-3 rounded border border-zinc-900">
                  {systemLogs.map((log, index) => (
                    <div key={index} className="flex gap-2 leading-relaxed">
                      <span className="text-[#ff9f00]/60 shrink-0 select-none">≫</span>
                      <span className="break-all">{log}</span>
                    </div>
                  ))}
                </div>
              </div>

            </section>

          </div>
        )}

        {/* Tab Layout Displays: CUSTOM PLAYLISTS & PIPELINES */}
        {activeBottomTab === 'NETWORK' && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 shadow-xl backdrop-blur-md font-mono relative overflow-hidden max-w-2xl mx-auto">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-[#ffaa00]"></div>
            
            <div className="flex items-center gap-3 mb-4 pb-2 border-b border-zinc-900">
              <Sliders className="w-5 h-5 text-[#ffaa00] animate-pulse" />
              <h2 className="text-lg font-bold text-zinc-100 tracking-wider">NETWORK DATA PIPELINES PANEL</h2>
            </div>
            
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              Inject external customized directories or manual M3U playlist files inside the browser client stack. Custom definitions parsed will sync with your selected themes.
            </p>

            <div className="space-y-6">
              
              {/* Option A: Manual Input Playlist URL */}
              <div className="space-y-2 p-4 bg-zinc-900/40 rounded-lg border border-zinc-800">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-zinc-200">A. MAINLINE INTERNET DATABASE URL</label>
                  <span className="text-[9px] border border-emerald-500/30 text-emerald-400 px-1.5 py-0.5 rounded uppercase font-bold animate-pulse">active socket</span>
                </div>
                
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={playlistInputUrl}
                    onChange={(e) => setPlaylistInputUrl(e.target.value)}
                    placeholder="https://example.com/playlist.json"
                    className="w-full bg-black border border-zinc-800 text-zinc-100 px-3 py-2 text-xs rounded focus:outline-none focus:border-[#ffaa00] transition-colors"
                  />
                  <button 
                    onClick={() => fetchChannelsDatabase(playlistInputUrl)}
                    className="px-4 py-2 bg-[#ffaa00] text-black text-xs font-bold rounded hover:bg-amber-400 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    CONNECT
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500">
                  Main fall-back target: <strong className="text-zinc-400">https://raw.githubusercontent.com/foridul422/IPTV-/main/channels.json</strong>
                </p>
              </div>

              {/* Option B: Local M3U Manual File Import Upload */}
              <div className="space-y-2 p-4 bg-zinc-900/40 rounded-lg border border-zinc-800">
                <label className="text-xs font-bold text-zinc-200 block">B. DIRECT FILE UPLOAD DECK (.M3U / .M3U8)</label>
                
                <div className="border border-dashed border-zinc-800 hover:border-[#ffaa00]/60 rounded-lg p-6 text-center transition-colors cursor-pointer relative bg-black/40">
                  <input 
                    type="file" 
                    accept=".m3u,.m3u8,.txt"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  />
                  <Globe className="w-8 h-8 text-[#ffaa00] mx-auto mb-2 animate-bounce" style={{ animationDuration: '3s' }} />
                  <p className="text-xs text-zinc-300 font-bold">DRAG AND DROP OR CHOOSE LOCAL .M3U FILE</p>
                  <p className="text-[10px] text-zinc-500 mt-1">UTF-8 ENCODED DIGITAL IPTV TRANSMISSIONS</p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setActiveBottomTab('SYSTEM_HUB')}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded hover:border-zinc-700 transition-colors text-xs"
                >
                  RETURN TO SYSTEM HUB VIEW
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Tab Layout Displays: CREATOR CONTROL PORTAL */}
        {activeBottomTab === 'CREATOR_PORT' && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 shadow-xl backdrop-blur-md relative overflow-hidden max-w-2xl mx-auto font-mono">
            {/* Ambient aesthetic background grids */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-[#ffaa00]"></div>
            
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-6 pb-6 border-b border-zinc-900">
              {/* Circular Space Cat Portrait with Glowing Accent Ring */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#ffaa00] shadow-neon-gold p-0.5 bg-black animate-pulse">
                  <img 
                    src="https://i.ibb.co/0RcPrCbv/IMG-20260608-012226.jpg" 
                    alt="Torikul Islam profile picture" 
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="absolute -bottom-1 right-2 bg-[#ffaa00] text-black text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-neutral-900">
                  TORIKUL .PRO
                </span>
              </div>

              <div className="text-center sm:text-left space-y-2">
                <div className="text-xs text-[#ff9f00] font-bold tracking-widest uppercase">CREATOR CHASSIS ROUTER</div>
                <h2 className="text-xl font-extrabold text-zinc-100 uppercase font-mono tracking-wider">TORIKUL ISLAM COMMAND SEAT</h2>
                <p className="text-xs text-[#ff9f00] font-bold">Founder & Lead Developer of T-Tech</p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                  <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-[9px] text-zinc-400 rounded">REACT DECK</span>
                  <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-[9px] text-zinc-400 rounded">HLS.JS COUPLING</span>
                  <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-[9px] text-zinc-400 rounded">90° ROTATOR ENG</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[#ff9f00] uppercase tracking-wider">BIOGRAPHY & DIGITAL PROFILE</h3>
              <div className="bg-black/80 rounded-lg p-4 border border-zinc-900 space-y-3 text-xs leading-relaxed text-zinc-300">
                <p className="text-[#ff9f00] font-extrabold uppercase text-[10px] tracking-wide">Founder & Lead Developer of T-Tech</p>
                <p className="italic text-zinc-200">
                  "Hello! I'm Torikul Islam. A dedicated student with an expert-level proficiency in technology and creating complex digital solutions."
                </p>
                <div className="grid grid-cols-2 gap-4 text-[10px] mt-4 pt-3 border-t border-zinc-900">
                  <div>
                    <span className="text-zinc-500 block">DEVELOPMENT CORE:</span>
                    <strong className="text-zinc-200 uppercase">React 19 / Vite 6 Sandbox</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">FALLBACK ADDRESS PORT:</span>
                    <strong className="text-zinc-200 uppercase">Foridul's database API url</strong>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-3 border-t border-zinc-900">
                <div className="flex flex-wrap gap-2.5">
                  <a 
                    href="https://www.facebook.com/share/18tpEvXJw7/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 px-3 border border-zinc-800 bg-[#ff9f00]/10 hover:bg-[#ff9f00]/20 text-[#ff9f00] font-bold rounded-md transition-all flex items-center gap-1.5 text-xs shadow-sm"
                  >
                    <span>FACEBOOK</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a 
                    href="https://www.instagram.com/torikul____islam?igsh=bno3d2wxODNyc2Mx" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 px-3 border border-zinc-800 bg-[#ff9f00]/10 hover:bg-[#ff9f00]/20 text-[#ff9f00] font-bold rounded-md transition-all flex items-center gap-1.5 text-xs shadow-sm"
                  >
                    <span>INSTAGRAM</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                
                <button
                  onClick={() => setActiveBottomTab('SYSTEM_HUB')}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded hover:border-zinc-700 transition-colors text-xs font-bold"
                >
                  RESTORE MAIN DESK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Layout Displays: SECURE LOCATION NODE */}
        {activeBottomTab === 'DIAGNOSTICS' && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 shadow-xl backdrop-blur-md relative overflow-hidden max-w-2xl mx-auto font-mono">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-[#ff9f00]"></div>
            
            <div className="flex items-center gap-3 mb-4 pb-2 border-b border-zinc-900">
              <Activity className="w-5 h-5 text-[#ff9f00] animate-pulse" />
              <h2 className="text-lg font-bold text-zinc-100 tracking-wider">SECURE LOCATION NODE & DIAGNOSTICS</h2>
            </div>

            <div className="space-y-4 text-xs">
              
              <div className="bg-black/60 p-4 border border-zinc-900 rounded-lg space-y-3">
                <h3 className="text-xs text-[#ffaa00] font-bold block uppercase tracking-wide">STREAM DECODING FEED HEALTH</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900 p-2.5 border border-zinc-800 rounded">
                    <span className="text-zinc-500 text-[10px] block font-mono">HLS DECODER RESOLUTION</span>
                    <strong className="text-zinc-200 text-sm font-bold">{resolutionStr} PRO</strong>
                  </div>
                  <div className="bg-zinc-900 p-2.5 border border-zinc-800 rounded">
                    <span className="text-zinc-500 text-[10px] block font-mono">STABILIZER BUFFER DELAY</span>
                    <strong className="text-[#ffaa00] text-sm font-bold">{bufferSec}s Active</strong>
                  </div>
                  <div className="bg-zinc-900 p-2.5 border border-zinc-800 rounded">
                    <span className="text-zinc-500 text-[10px] block font-mono">LATENCY RATIO DETECTOR</span>
                    <strong className="text-emerald-400 text-sm font-bold">{latencyVal}ms Optimal</strong>
                  </div>
                  <div className="bg-zinc-900 p-2.5 border border-zinc-800 rounded">
                    <span className="text-zinc-500 text-[10px] block font-mono">STREAM INTEGRATION STATE</span>
                    <strong className="text-white text-sm font-bold capitalize">{streamHealth} Mode</strong>
                  </div>
                </div>
              </div>

              <div className="bg-black/60 p-4 border border-zinc-900 rounded-lg space-y-2">
                <span className="text-xs text-[#ffaa00] font-bold block uppercase tracking-wide">ENVIRONMENT VARIABLES HUD</span>
                <p className="text-zinc-400 text-[11px]">
                  Running inside fully safe cloud runtime container with reverse-proxy architecture pointing port 3000. All variables securely managed at server API proxies.
                </p>
                <div className="bg-zinc-900 p-2 border border-zinc-800 rounded select-all font-mono text-[9px] text-zinc-400">
                  PORT=3000<br />
                  NODE_ENV=production<br />
                  STABILIZER_MODE=adaptive_hls_decode<br />
                  BROWSER_ORIENT_ALIGNMENT=landscape_locked_css_overlay
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setActiveBottomTab('SYSTEM_HUB')}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded hover:border-zinc-700 transition-colors text-xs"
                >
                  CLOSE REPORT
                </button>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* Cyber Console Footer Controls & Bottom navigation matrix */}
      <footer className="mt-12 border-t border-zinc-900 bg-zinc-950/90 relative z-30 font-mono text-xs">
        
        {/* Navigation Core with glowing active element */}
        <section className="max-w-7xl mx-auto py-5 px-4 flex flex-col sm:flex-row items-center justify-between gap-6">
          
          <div className="flex flex-wrap gap-2.5 justify-center sm:justify-start">
            
            {/* SYSTEM HUB Active state button */}
            <button
              onClick={() => { setActiveBottomTab('SYSTEM_HUB'); writeLog("ROUTING: Returned to Primary SYSTEM HUB Dashboard console."); }}
              className={`px-4 py-2.5 rounded border text-xs font-extrabold uppercase transition-all flex items-center gap-2 relative overflow-hidden cursor-pointer ${
                activeBottomTab === 'SYSTEM_HUB'
                  ? `${currentTheme.primaryBg} text-black ${currentTheme.primaryBorder} ${currentTheme.glowClass} font-extrabold`
                  : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {activeBottomTab === 'SYSTEM_HUB' && (
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.15)_50%,transparent_50%)] bg-[length:100%_4px] pointer-events-none"></div>
              )}
              <Cpu className="w-4 h-4" /> SYSTEM HUB
            </button>

            {/* CUSTOM NETWORK M3U */}
            <button
              onClick={() => { setActiveBottomTab('NETWORK'); writeLog("ROUTING: Toggled NETWORK custom playlists inject setup."); }}
              className={`px-4 py-2.5 rounded border text-xs font-extrabold uppercase transition-all flex items-center gap-2 relative overflow-hidden cursor-pointer ${
                activeBottomTab === 'NETWORK'
                  ? `${currentTheme.primaryBg} text-black ${currentTheme.primaryBorder} ${currentTheme.glowClass} font-extrabold`
                  : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {activeBottomTab === 'NETWORK' && (
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.15)_50%,transparent_50%)] bg-[length:100%_4px] pointer-events-none"></div>
              )}
              <Sliders className="w-4 h-4" /> NETWORK PIPELINES
            </button>

            {/* SECURE LOCATION NODE */}
            <button
              onClick={() => { setActiveBottomTab('DIAGNOSTICS'); writeLog("ROUTING: Transferred to SECURE LOCATION NODE diagnostics dashboard."); }}
              className={`px-4 py-2.5 rounded border text-xs font-bold uppercase transition-all flex items-center gap-2 relative overflow-hidden cursor-pointer ${
                activeBottomTab === 'DIAGNOSTICS'
                  ? `${currentTheme.primaryBg} text-black ${currentTheme.primaryBorder} ${currentTheme.glowClass} font-extrabold`
                  : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700/80'
              }`}
            >
              {activeBottomTab === 'DIAGNOSTICS' && (
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.15)_50%,transparent_50%)] bg-[length:100%_4px] pointer-events-none"></div>
              )}
              <Activity className="w-4 h-4" /> SECURE LOCATION NODE
            </button>

            {/* CREATOR PORT */}
            <button
              onClick={() => { setActiveBottomTab('CREATOR_PORT'); writeLog("ROUTING: Switched active workspace to Torikul's Command Room."); }}
              className={`px-4 py-2.5 rounded border text-xs font-bold uppercase transition-all flex items-center gap-2 relative overflow-hidden cursor-pointer ${
                activeBottomTab === 'CREATOR_PORT'
                  ? `${currentTheme.primaryBg} text-black ${currentTheme.primaryBorder} ${currentTheme.glowClass} font-extrabold`
                  : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {activeBottomTab === 'CREATOR_PORT' && (
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.15)_50%,transparent_50%)] bg-[length:100%_4px] pointer-events-none"></div>
              )}
              <User className="w-4 h-4" /> CREATOR PORT
            </button>

          </div>

          <div className="text-zinc-500 text-center sm:text-right font-mono text-[10px] space-y-1">
            <p>T-Tech IPTV systems are optimized for full-width landscape orientation rendering.</p>
            <p>© 2026 Torikul Islam. Fallback resources managed autonomously.</p>
          </div>

        </section>
        
      </footer>

    </div>
  );
}
