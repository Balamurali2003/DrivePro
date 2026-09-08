export interface GeocodedLocation {
  originalLocation: string;
  normalizedLocation: string;
  territory: string;
  latitude: number | null;
  longitude: number | null;
  hasLocation: boolean;
}

// Canonical Locality Dictionary for Tirunelveli District & Tamil Nadu
interface LocalityDef {
  canonicalName: string;
  territory: string;
  lat: number;
  lng: number;
  aliases: string[];
}

const LOCALITIES: LocalityDef[] = [
  {
    canonicalName: 'Tirunelveli Central, Tamil Nadu',
    territory: 'Tirunelveli',
    lat: 8.7139,
    lng: 77.7567,
    aliases: ['திருநெல்வேலி', 'tirunelveli', 'nellai', 'tirunelveli central', 'tirunelveli dist']
  },
  {
    canonicalName: 'Palayamkottai, Tirunelveli, Tamil Nadu',
    territory: 'Palayamkottai',
    lat: 8.7176,
    lng: 77.7478,
    aliases: ['பாளையங்கோட்டை', 'palayamkottai', 'pallayam kottai', 'palai', 'palai bus stand', 'palayamkottai finance']
  },
  {
    canonicalName: 'Melapalayam, Tirunelveli, Tamil Nadu',
    territory: 'Melapalayam',
    lat: 8.6974,
    lng: 77.7289,
    aliases: ['மேலப்பாளையம்', 'melapalayam', 'melappalaiyam', 'melapalaiyam']
  },
  {
    canonicalName: 'Pettai, Tirunelveli, Tamil Nadu',
    territory: 'Pettai',
    lat: 8.7303,
    lng: 77.6788,
    aliases: ['பேட்டை', 'pettai', 'pettai/nagaram', 'pettai nagaram']
  },
  {
    canonicalName: 'Tirunelveli Town, Tamil Nadu',
    territory: 'Tirunelveli Town',
    lat: 8.7294,
    lng: 77.6896,
    aliases: ['town', 'tntown', 'tn town', 'tirunelveli town', 'town d+l', 'town sripuram', 'sripuram']
  },
  {
    canonicalName: 'Tirunelveli Junction, Tamil Nadu',
    territory: 'Tirunelveli Junction',
    lat: 8.7291,
    lng: 77.7126,
    aliases: ['junction', 'tirunelveli junction', 'nellai junction']
  },
  {
    canonicalName: 'Shanthi Nagar, Palayamkottai, Tirunelveli, Tamil Nadu',
    territory: 'Shanthi Nagar',
    lat: 8.7100,
    lng: 77.7450,
    aliases: ['shanthinagar', 'shanthi nagar', 'santhi nagar']
  },
  {
    canonicalName: 'KTC Nagar, Tirunelveli, Tamil Nadu',
    territory: 'KTC Nagar',
    lat: 8.7188,
    lng: 77.7682,
    aliases: ['ktcnagar', 'ktc nagar', 'ktc nagar tenkasi dl']
  },
  {
    canonicalName: 'Sankar Nagar, Tirunelveli, Tamil Nadu',
    territory: 'Sankar Nagar',
    lat: 8.7972,
    lng: 77.7186,
    aliases: ['sankarnagar', 'sankar nagar', 'sankarnagar tirunelveli']
  },
  {
    canonicalName: 'Kamaraj Nagar, Tirunelveli, Tamil Nadu',
    territory: 'Kamaraj Nagar',
    lat: 8.7050,
    lng: 77.7400,
    aliases: ['kamrajnagar', 'kamaraj nagar', 'kamraj nagar']
  },
  {
    canonicalName: 'Melapattam, Tirunelveli, Tamil Nadu',
    territory: 'Melapattam',
    lat: 8.6500,
    lng: 77.8000,
    aliases: ['melapattam', 'mela pattam']
  },
  {
    canonicalName: 'Gangaikondan, Tirunelveli, Tamil Nadu',
    territory: 'Gangaikondan',
    lat: 8.8557,
    lng: 77.7818,
    aliases: ['gangaikondan', 'gangaikondan d+l', 'gangai kondan']
  },
  {
    canonicalName: 'Kodeeswaran Nagar, Tirunelveli, Tamil Nadu',
    territory: 'Kodeeswaran Nagar',
    lat: 8.7250,
    lng: 77.6950,
    aliases: ['kodishwaran nagar', 'kodeeswaran nagar', 'kodeswaran nagar']
  },
  {
    canonicalName: 'Suthamalli, Tirunelveli, Tamil Nadu',
    territory: 'Suthamalli',
    lat: 8.7150,
    lng: 77.6521,
    aliases: ['suththamalli', 'suthamalli', 'suththamali']
  },
  {
    canonicalName: 'Munnirpallam, Tirunelveli, Tamil Nadu',
    territory: 'Munnirpallam',
    lat: 8.6653,
    lng: 77.7196,
    aliases: ['munner pallam', 'munnirpalaiyam', 'munnirpallam', 'munirpallam']
  },
  {
    canonicalName: 'Melakulam, Tirunelveli, Tamil Nadu',
    territory: 'Melakulam',
    lat: 8.6300,
    lng: 77.7300,
    aliases: ['melakulam', 'mela kulam']
  },
  {
    canonicalName: 'Rahmath Nagar, Palayamkottai, Tirunelveli, Tamil Nadu',
    territory: 'Rahmath Nagar',
    lat: 8.7122,
    lng: 77.7554,
    aliases: ['rahmath nagar', 'rahmat nagar']
  },
  {
    canonicalName: 'Reddiarpatti, Tirunelveli, Tamil Nadu',
    territory: 'Reddiarpatti',
    lat: 8.6738,
    lng: 77.7431,
    aliases: ['reddiyarpatti', 'reddiarpatti', 'reddiyar patti']
  },
  {
    canonicalName: 'Perumalpuram, Palayamkottai, Tirunelveli, Tamil Nadu',
    territory: 'Perumalpuram',
    lat: 8.6983,
    lng: 77.7547,
    aliases: ['perumalpuram', 'perumalpuram tomorrow d+l', 'perumalpuram retired']
  },
  {
    canonicalName: 'Ramayanpatti, Tirunelveli, Tamil Nadu',
    territory: 'Ramayanpatti',
    lat: 8.7800,
    lng: 77.7100,
    aliases: ['ramayanpatti', 'ramaiyanpatti']
  },
  {
    canonicalName: 'Senthamangalam, Tirunelveli, Tamil Nadu',
    territory: 'Senthamangalam',
    lat: 8.7350,
    lng: 77.7300,
    aliases: ['senthimangalam', 'senthamangalam']
  },
  {
    canonicalName: 'Pottal Nagar, Tirunelveli, Tamil Nadu',
    territory: 'Pottal Nagar',
    lat: 8.6800,
    lng: 77.7300,
    aliases: ['pottalnagar', 'pottal nagar']
  },
  {
    canonicalName: 'Valliyoor, Tirunelveli, Tamil Nadu',
    territory: 'Valliyoor',
    lat: 8.3794,
    lng: 77.6147,
    aliases: ['valliyoor', 'valliyur']
  },
  {
    canonicalName: 'NGO Colony, Tirunelveli, Tamil Nadu',
    territory: 'NGO Colony',
    lat: 8.6882,
    lng: 77.7490,
    aliases: ['ngo colony', 'n.g.o colony', 'ngo colony tirunelveli']
  },
  {
    canonicalName: 'MS University, Abishekapatti, Tirunelveli, Tamil Nadu',
    territory: 'MS University',
    lat: 8.7130,
    lng: 77.6630,
    aliases: ['ms univar sitti', 'ms university', 'manonmaniam sundaranar university']
  },
  {
    canonicalName: 'Mahilchi Nagar, Tirunelveli, Tamil Nadu',
    territory: 'Mahilchi Nagar',
    lat: 8.7020,
    lng: 77.7500,
    aliases: ['mahilchi nagar', 'mahilchi nagar confirm']
  },
  {
    canonicalName: 'Aruvankulam, Tirunelveli, Tamil Nadu',
    territory: 'Aruvankulam',
    lat: 8.7200,
    lng: 77.6800,
    aliases: ['aruvankulam', 'aruvan kulam']
  },
  {
    canonicalName: 'Thatchanallur, Tirunelveli, Tamil Nadu',
    territory: 'Thatchanallur',
    lat: 8.7523,
    lng: 77.7184,
    aliases: ['thatchanallur', 'thatcha nallur']
  },
  {
    canonicalName: 'Other Areas, Tirunelveli District, Tamil Nadu',
    territory: 'Other Areas',
    lat: 8.7200,
    lng: 77.7350,
    aliases: ['மற்ற_பகுதிகள்', 'other areas', 'other area', 'other', 'others']
  },
  {
    canonicalName: 'Tenkasi, Tamil Nadu',
    territory: 'Tenkasi',
    lat: 8.9594,
    lng: 77.3152,
    aliases: ['tenkasi', 'thenkasi']
  },
  {
    canonicalName: 'Nagercoil, Kanyakumari, Tamil Nadu',
    territory: 'Nagercoil',
    lat: 8.1833,
    lng: 77.4119,
    aliases: ['nagercoil', 'nagerkovil']
  },
  {
    canonicalName: 'Thoothukudi, Tamil Nadu',
    territory: 'Thoothukudi',
    lat: 8.7642,
    lng: 78.1348,
    aliases: ['tuticorin', 'thoothukudi', 'tuticorin port']
  }
];

export class GeocodingService {
  /**
   * Geocodes a location string using the Tirunelveli canonical dictionary.
   * If coordinates cannot be safely determined, returns hasLocation = false.
   */
  public static geocode(rawLocation?: string | null): GeocodedLocation {
    const raw = (rawLocation || '').trim();
    if (!raw) {
      return {
        originalLocation: '',
        normalizedLocation: 'Location unavailable',
        territory: 'Unspecified',
        latitude: null,
        longitude: null,
        hasLocation: false
      };
    }

    // Clean extraneous notes that might be appended in Excel comments
    const cleanLower = raw
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/(\btomorrow\b|\bd\+l\b|\bretired\b|\bfinance\b|\bconfirm\b|\bconformation\b|\btenkasi dl\b)/gi, '')
      .trim();

    // 1. First Pass: Exact alias match
    for (const loc of LOCALITIES) {
      for (const alias of loc.aliases) {
        if (cleanLower === alias || raw === alias) {
          return {
            originalLocation: raw,
            normalizedLocation: loc.canonicalName,
            territory: loc.territory,
            latitude: loc.lat,
            longitude: loc.lng,
            hasLocation: true
          };
        }
      }
    }

    // 2. Second Pass: Specific neighborhood substring match (prioritize specific localities before generic district name)
    for (const loc of LOCALITIES) {
      if (loc.territory === 'Tirunelveli' || loc.territory === 'Other Areas') continue;
      for (const alias of loc.aliases) {
        if (cleanLower.includes(alias)) {
          return {
            originalLocation: raw,
            normalizedLocation: loc.canonicalName,
            territory: loc.territory,
            latitude: loc.lat,
            longitude: loc.lng,
            hasLocation: true
          };
        }
      }
    }

    // 3. Third Pass: Generic district / Other areas match
    for (const loc of LOCALITIES) {
      for (const alias of loc.aliases) {
        if (cleanLower.includes(alias)) {
          return {
            originalLocation: raw,
            normalizedLocation: loc.canonicalName,
            territory: loc.territory,
            latitude: loc.lat,
            longitude: loc.lng,
            hasLocation: true
          };
        }
      }
    }

    // Invalid location strings that were notes in Excel (e.g. "Balance")
    if (cleanLower === 'balance' || cleanLower === 'none' || cleanLower === 'n/a' || cleanLower.length < 2) {
      return {
        originalLocation: raw,
        normalizedLocation: 'Location unavailable',
        territory: 'Unspecified',
        latitude: null,
        longitude: null,
        hasLocation: false
      };
    }

    // Fallback if it contains general keywords
    if (cleanLower.includes('tamil') || cleanLower.includes('india')) {
      return {
        originalLocation: raw,
        normalizedLocation: `${raw}, Tamil Nadu`,
        territory: raw,
        latitude: 8.7139,
        longitude: 77.7567,
        hasLocation: true
      };
    }

    // Could not safely geocode without guessing
    return {
      originalLocation: raw,
      normalizedLocation: raw,
      territory: raw,
      latitude: null,
      longitude: null,
      hasLocation: false
    };
  }

  /**
   * Applies a micro-dispersion offset so multiple markers sharing exact neighborhood coordinates
   * don't occlude each other when zoomed into individual marker level.
   */
  public static applyDispersion(lat: number, lng: number, index: number): { lat: number; lng: number } {
    if (index === 0) return { lat, lng };
    // Golden angle spiral distribution
    const angle = index * 137.5 * (Math.PI / 180);
    const radius = 0.00035 * Math.sqrt(index); // ~35 meters per ring
    const dLat = radius * Math.cos(angle);
    const dLng = radius * Math.sin(angle);
    return {
      lat: Number((lat + dLat).toFixed(6)),
      lng: Number((lng + dLng).toFixed(6))
    };
  }
}
