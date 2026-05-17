/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Home, 
  BookOpen, 
  Heart, 
  CircleDot, 
  Search, 
  ChevronRight, 
  History, 
  CheckCircle2, 
  X,
  Bell,
  Calendar,
  MapPin,
  RefreshCcw,
  Minus,
  Plus,
  Moon,
  Sun,
  QrCode,
  Wallet,
  Locate,
  Volume2,
  VolumeX,
  Navigation,
  Calculator,
  ListTodo,
  Sparkles,
  ChevronLeft,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- TYPES ---
interface PrayerTimes {
  subuh: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
  imsak: string;
  terbit: string;
  dhuha: string;
}

interface JadwalData {
  tanggal: string;
  imsak: string;
  subuh: string;
  terbit: string;
  dhuha: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
  date: string;
  hijri?: string;
}

// --- UTILS ---
const addMinutes = (time: string, minutes: number): string => {
  if (!time) return "--:--";
  const [h, m] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m + minutes, 0);
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':');
};

interface Surah {
  nomor: number;
  nama: string;
  namaLatin: string;
  jumlahAyat: number;
  tempatTurun: string;
  arti: string;
  deskripsi: string;
  audioFull: {
    "01": string;
  };
}

interface Ayat {
  nomorAyat: number;
  teksArab: string;
  teksLatin: string;
  teksIndonesia: string;
}

interface SurahDetail extends Surah {
  ayat: Ayat[];
}

interface Bookmark {
  surahNomor: number;
  surahName: string;
  ayatNomor?: number;
}

interface Doa {
  id: number;
  judul: string;
  arab: string;
  latin: string;
  terjemahan: string;
}

// --- CONSTANTS ---
const PRAYER_NAMES: { [key: string]: string } = {
  imsak: 'Imsak',
  subuh: 'Subuh',
  terbit: 'Terbit',
  dzuhur: 'Dzuhur',
  ashar: 'Ashar',
  maghrib: 'Maghrib',
  isya: 'Isya',
};

const DUA_COLLECTION: Doa[] = [
  {
    id: 1,
    judul: "Doa Sebelum Makan",
    arab: "اللَّهُمَّ بَارِكْ لَنَا فِيمَا رَزَقْتَنَا وَقِنَا عَذَابَ النَّارِ",
    latin: "Allahumma baarik lanaa fiimaa razaqtanaa wa qinaa 'adzaabannar.",
    terjemahan: "Ya Allah, berkahilah kami atas rezeki yang telah Engkau berikan kepada kami dan jagalah kami dari siksa api neraka."
  },
  {
    id: 2,
    judul: "Doa Sesudah Makan",
    arab: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ",
    latin: "Alhamdu lillaahil ladzii ath'amanaa wa saqaanaa wa ja'alanaa muslimiin.",
    terjemahan: "Segala puji bagi Allah yang telah memberi kami makan dan minum, serta menjadikan kami orang-orang muslim."
  },
  {
    id: 3,
    judul: "Doa Sebelum Tidur",
    arab: "بِاسْمِكَ اللَّهُمَّ أَحْيَا وَبِاسْمِكَ أَمُوتُ",
    latin: "Bismika Allahumma ahyaa wa bismika amuut.",
    terjemahan: "Dengan nama-Mu ya Allah aku hidup dan dengan nama-Mu aku mati."
  },
  {
    id: 4,
    judul: "Doa Bangun Tidur",
    arab: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
    latin: "Alhamdu lillaahil ladzii ahyaanaa ba'da maa amaatanaa wa ilaihin nusyuur.",
    terjemahan: "Segala puji bagi Allah yang telah menghidupkan kami setelah mematikan kami dan kepada-Nya lah kami kembali."
  },
  {
    id: 5,
    judul: "Doa Masuk Masjid",
    arab: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
    latin: "Allahummaftah lii abwaaba rahmatik.",
    terjemahan: "Ya Allah, bukakanlah pintu-pintu rahmat-Mu untukku."
  },
  {
    id: 6,
    judul: "Doa Keluar Masjid",
    arab: "اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ",
    latin: "Allahumma inni as-aluka min fadblik.",
    terjemahan: "Ya Allah, sesungguhnya aku memohon keutamaan dari-Mu."
  },
  {
    id: 7,
    judul: "Doa Masuk Kamar Mandi",
    arab: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ",
    latin: "Allahumma inni a'udzubika minal khubutsi wal khabaits.",
    terjemahan: "Ya Allah, sesungguhnya aku berlindung kepada-Mu dari godaan setan laki-laki dan setan perempuan."
  },
  {
    id: 8,
    judul: "Doa Keluar Kamar Mandi",
    arab: "غُفْرَانَكَ الْحَمْدُ لِلَّهِ الَّذِي أَذْهَبَ عَنِّي الْأَذَى وَعَافَانِي",
    latin: "Ghufranaka alhamdulillahilladzi adzhaba 'annil adzaa wa 'aafanii.",
    terjemahan: "Aku memohon ampunan-Mu. Segala puji bagi Allah yang telah menghilangkan kotoran dari tubuhku dan menyehatkan aku."
  },
  {
    id: 9,
    judul: "Doa Keluar Rumah",
    arab: "بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
    latin: "Bismillahi tawakkaltu 'alallah laa hawla wa laa quwwata illa billah.",
    terjemahan: "Dengan nama Allah, aku bertawakal kepada Allah. Tiada daya dan kekuatan kecuali dengan pertolongan Allah."
  },
  {
    id: 10,
    judul: "Doa Untuk Kedua Orang Tua",
    arab: "رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ وَارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا",
    latin: "Rabbighfir lii wa liwaalidayya warhamhumaa kamaa rabbayaanii shaghiiraa.",
    terjemahan: "Ya Tuhanku, ampunilah aku dan kedua orang tuaku, dan sayangilah mereka sebagaimana mereka telah mendidikku di waktu kecil."
  },
  {
    id: 11,
    judul: "Doa Sapu Jagad",
    arab: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    latin: "Rabbana aatina fiddunya hasanah wa fil akhirati hasanah wa qina 'adzabannar.",
    terjemahan: "Ya Tuhan kami, berilah kami kebaikan di dunia dan kebaikan di akhirat, dan lindungilah kami dari azab neraka."
  }
];

const DZIKIR_PAGI_PETANG = [
  { 
    id: 1, 
    judul: "Ayat Kursi", 
    arab: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ وَلَا يَئُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ", 
    latin: "Allāhu lā ilāha illā huwal-ḥayyul-qayyūm...",
    target: 1 
  },
  { 
    id: 2, 
    judul: "Al-Ikhlas", 
    arab: "قُلْ هُوَ اللَّهُ أَحَدٌ . اللَّهُ الصَّمَدُ . لَمْ يَلِدْ وَلَمْ يُولَدْ . وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ", 
    latin: "Qul huwallāhu aḥad. Allāhuṣ-ṣamad...",
    target: 3 
  },
  { 
    id: 3, 
    judul: "Al-Falaq", 
    arab: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ . مِن شَرِّ مَا خَلَقَ . وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ . وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ . وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ", 
    latin: "Qul a'ūżu birabbil-falaq...",
    target: 3 
  },
  { 
    id: 4, 
    judul: "An-Nas", 
    arab: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ . مَلِكِ النَّاسِ . إِلَٰهِ النَّاسِ . مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ . الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ . مِنَ الْجِنَّةِ وَالنَّاسِ", 
    latin: "Qul a'ūżu birabbin-nās...",
    target: 3 
  },
  { 
    id: 5, 
    judul: "Sayyidul Istighfar", 
    arab: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ", 
    latin: "Allāhumma anta rabbī lā ilāha illā anta...",
    target: 1 
  },
];

// --- MUTABAAH ITEMS ---
const MUTABAAH_TASKS = [
  "Sholat Jamaah di Masjid",
  "Sholat Dhuha",
  "Dzikir Pagi/Petang",
  "Tilawah Al-Qur'an (One Day One Juz)",
  "Sedekah Harian"
];

const ANNOUNCEMENTS = [
  { id: 1, tag: "Kajian", title: "Kajian Rutin Malam Jumat", desc: "Bersama Ust. Abdul Somad - Ba'da Maghrib" },
  { id: 2, tag: "Keuangan", title: "Laporan Kas Masjid", desc: "Saldo per 17 Mei: Rp 12.450.000" },
  { id: 3, tag: "Infaq", title: "Infaq Pembangunan", desc: "Kebutuhan renovasi tempat wudhu Akhwat" },
];

const DAILY_HADITHS = [
  { text: "Kebersihan itu sebagian dari iman.", source: "HR. Muslim" },
  { text: "Senyummu di hadapan saudaramu adalah sedekah.", source: "HR. Tirmidzi" },
  { text: "Sebaik-baik manusia adalah yang paling bermanfaat bagi orang lain.", source: "HR. Ahmad" },
  { text: "Tangan di atas lebih baik daripada tangan di bawah.", source: "HR. Bukhari & Muslim" },
  { text: "Barangsiapa yang menempuh jalan untuk mencari ilmu, maka Allah akan memudahkan baginya jalan menuju surga.", source: "HR. Muslim" },
  { text: "Sholat berjamaah sepuluh kali lebih baik daripada sholat sendirian.", source: "HR. Bukhari" },
  { text: "Berbicaralah yang baik atau diam.", source: "HR. Bukhari" }
];

// --- COMPONENTS ---

const Header = ({ darkMode, setDarkMode }: { darkMode: boolean, setDarkMode: (v: boolean) => void }) => (
  <header className={`fixed top-0 left-0 right-0 z-50 ${darkMode ? 'bg-slate-900 border-b border-slate-800' : 'bg-emerald-800'} text-emerald-50 py-4 px-6 shadow-md flex items-center justify-between transition-colors`}>
    <div className="flex items-center gap-3">
      <img 
        src="/src/assets/images/logo_masjid.png" 
        alt="Logo Masjid" 
        className="w-12 h-12 object-contain"
        referrerPolicy="no-referrer"
      />
      <div>
        <h1 className="font-bold text-lg leading-tight">DKM Halimatul Amin</h1>
        <p className="text-xs text-emerald-200">Cibitung, Kab. Bekasi</p>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <button 
        onClick={() => setDarkMode(!darkMode)}
        className={`p-2 rounded-xl ${darkMode ? 'bg-slate-800 text-amber-400' : 'bg-emerald-700 text-amber-200'} transition-colors`}
      >
        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
    </div>
  </header>
);

const SectionTitle = ({ title, icon: Icon, action }: { title: string, icon: any, action?: React.ReactNode }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <div className="p-2 bg-emerald-100 rounded-lg">
        <Icon className="w-5 h-5 text-emerald-700" />
      </div>
      <h2 className="text-xl font-bold text-emerald-900">{title}</h2>
    </div>
    {action}
  </div>
);

// --- SECTION: MUTABAAH ---
const MutabaahSection = ({ darkMode }: { darkMode: boolean }) => {
  const [tasks, setTasks] = useState<{ [key: string]: boolean }>(() => {
    const saved = localStorage.getItem('mutabaah-journal');
    const today = new Date().toISOString().split('T')[0];
    const data = saved ? JSON.parse(saved) : {};
    
    if (data.date !== today) {
      return { date: today };
    }
    return data;
  });

  const toggleTask = (task: string) => {
    const newTasks = { ...tasks, [task]: !tasks[task] };
    setTasks(newTasks);
    localStorage.setItem('mutabaah-journal', JSON.stringify(newTasks));
  };

  const progress = useMemo(() => {
    const completed = MUTABAAH_TASKS.filter(t => tasks[t]).length;
    return Math.round((completed / MUTABAAH_TASKS.length) * 100);
  }, [tasks]);

  return (
    <section className="mt-8">
      <SectionTitle title="Jurnal Ibadah" icon={ListTodo} />
      <div className={`p-6 rounded-3xl border shadow-sm ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
             <p className={`font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-900'}`}>Target Harian</p>
             <p className="text-xs text-gray-400">Istiqomah adalah kunci keberkahan</p>
          </div>
          <div className="text-right">
             <p className="text-2xl font-bold text-emerald-600">{progress}%</p>
             <p className="text-[10px] text-gray-400 font-bold uppercase">Selesai</p>
          </div>
        </div>
        
        <div className="w-full bg-gray-100 rounded-full h-2 mb-6 overflow-hidden">
           <motion.div 
             initial={{ width: 0 }}
             animate={{ width: `${progress}%` }}
             className="h-full bg-emerald-500"
           />
        </div>

        <div className="space-y-3">
          {MUTABAAH_TASKS.map((task) => (
            <button 
              key={task}
              onClick={() => toggleTask(task)}
              className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all border ${
                tasks[task] 
                  ? (darkMode ? 'bg-emerald-900/30 border-emerald-500/50' : 'bg-emerald-50 border-emerald-200')
                  : (darkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-100')
              }`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                tasks[task] ? 'bg-emerald-500 text-white' : 'bg-gray-200'
              }`}>
                {tasks[task] && <CheckCircle2 className="w-4 h-4" />}
              </div>
              <span className={`text-sm font-medium ${tasks[task] ? (darkMode ? 'text-emerald-300' : 'text-emerald-800') : (darkMode ? 'text-slate-400' : 'text-gray-600')}`}>
                {task}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- TAB: HOME ---
const HomeTab = ({ 
  darkMode, 
  jadwal, 
  loading, 
  error, 
  isGeo, 
  fetchPrayerTimes, 
  handleGeolocation,
  adzanEnabled,
  setAdzanEnabled
}: { 
  darkMode: boolean, 
  jadwal: JadwalData | null, 
  loading: boolean, 
  error: string | null, 
  isGeo: boolean,
  fetchPrayerTimes: () => void,
  handleGeolocation: () => void,
  adzanEnabled: boolean,
  setAdzanEnabled: (v: boolean) => void
}) => {
  const [nextPrayer, setNextPrayer] = useState<{ name: string, time: string, countdown: string } | null>(null);

  useEffect(() => {
    if (!jadwal) return;

    const timer = setInterval(() => {
      const now = new Date();
      const prayers = [
        { name: 'Imsak', time: jadwal.imsak },
        { name: 'Subuh', time: jadwal.subuh },
        { name: 'Terbit', time: jadwal.terbit },
        { name: 'Dzuhur', time: jadwal.dzuhur },
        { name: 'Ashar', time: jadwal.ashar },
        { name: 'Maghrib', time: jadwal.maghrib },
        { name: 'Isya', time: jadwal.isya },
      ];

      let found = false;
      for (const prayer of prayers) {
        const [h, m] = prayer.time.split(':').map(Number);
        const prayerTime = new Date();
        prayerTime.setHours(h, m, 0);

        if (prayerTime > now) {
          const diff = prayerTime.getTime() - now.getTime();
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const secs = Math.floor((diff % (1000 * 60)) / 1000);
          
          setNextPrayer({
            name: prayer.name,
            time: prayer.time,
            countdown: `${hours}j ${mins}m ${secs}s`
          });
          found = true;
          break;
        }
      }

      if (!found) {
         setNextPrayer({ name: 'Subuh', time: jadwal.subuh, countdown: "Menuju Esok" });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [jadwal]);

  const handleWA = () => {
    const text = encodeURIComponent("Assalamualaikum DKM Masjid Halimatul Amin, saya jemaah ingin bertanya mengenai...");
    window.open(`https://wa.me/6281234567890?text=${text}`, '_blank');
  };

  const handleMaps = () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=Masjid+Halimatul+Amin`, '_blank');
  };

  const randomHadith = useMemo(() => {
    return DAILY_HADITHS[Math.floor(Math.random() * DAILY_HADITHS.length)];
  }, []);

  const isyraqTime = useMemo(() => {
    if (!jadwal?.terbit) return "--:--";
    return addMinutes(jadwal.terbit, 15);
  }, [jadwal]);

  return (
    <div className="space-y-6 pb-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-emerald-700 rounded-3xl p-6 text-white shadow-xl shadow-emerald-200/50">
        <div className="absolute top-[-10%] right-[-10%] w-40 h-40 bg-emerald-600 rounded-full blur-3xl opacity-50" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-emerald-100 text-sm mb-2">
            <Calendar className="w-4 h-4" />
            <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} • {jadwal?.hijri || '...'}</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-100 text-xs mb-2">
            <MapPin className="w-4 h-4" />
            <span>{isGeo ? 'Lokasi Perangkat' : 'Jakarta - Bekasi & Sekitarnya'}</span>
            <button 
              onClick={handleGeolocation}
              className="ml-auto bg-white/20 p-1.5 rounded-lg hover:bg-white/30 transition-colors"
              title="Gunakan Lokasi Saya"
            >
              <Locate className="w-4 h-4" />
            </button>
          </div>
          
          {loading ? (
            <div className="h-24 flex items-center"><RefreshCcw className="animate-spin text-emerald-200" /></div>
          ) : error ? (
            <div className="h-24 flex flex-col justify-center">
              <p className="text-sm text-emerald-200 opacity-80">{error}</p>
              <button 
                onClick={fetchPrayerTimes}
                className="mt-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-xs font-bold transition-colors w-fit"
              >
                Coba Lagi
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-bold mb-1">
                {nextPrayer ? nextPrayer.time : '--:--'}
              </h2>
              <p className="text-emerald-100 font-medium mb-4">
                Menuju Waktu <span className="text-amber-400 font-bold">{nextPrayer?.name || '...'}</span>
              </p>
              
              <div className="flex items-center justify-between">
                <div className="bg-emerald-800/50 backdrop-blur-sm rounded-xl p-3 inline-block">
                   <p className="text-xs uppercase tracking-wider text-emerald-200 mb-1">Hitung Mundur</p>
                   <p className="font-mono text-xl font-bold text-amber-400">{nextPrayer?.countdown || '--:--:--'}</p>
                </div>
                
                <button 
                   onClick={() => setAdzanEnabled(!adzanEnabled)}
                   className={`flex items-center gap-2 px-4 py-3 rounded-2xl transition-all font-bold text-xs ${
                     adzanEnabled ? 'bg-amber-500 text-emerald-900 shadow-lg' : 'bg-white/10 text-emerald-100'
                   }`}
                >
                   {adzanEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                   {adzanEnabled ? 'Adzan Aktif' : 'Adzan Mute'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Prayer Schedule */}
      <section>
        <SectionTitle 
          title="Jadwal Sholat" 
          icon={History} 
          action={
            jadwal && (
              <div className="bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-2">
                 <Sun className="w-4 h-4 text-amber-600" />
                 <span className="text-[10px] font-bold text-amber-700 uppercase">Awal Dhuha: {isyraqTime}</span>
              </div>
            )
          }
        />
        {loading ? (
          <div className="grid grid-cols-3 gap-3">
             {[1,2,3,4,5,6].map(i => (
               <div key={i} className="bg-white p-3 rounded-2xl h-20 animate-pulse border border-gray-100" />
             ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {jadwal && Object.entries(PRAYER_NAMES).map(([key, label]) => {
              const isPassing = nextPrayer?.name.toLowerCase() === label.toLowerCase();
              return (
                <div 
                  key={key} 
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    isPassing 
                    ? 'bg-amber-50 border-amber-300 shadow-md ring-2 ring-amber-100' 
                    : (darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100')
                  }`}
                >
                  <p className={`text-[10px] font-bold uppercase mb-1 ${
                    isPassing ? 'text-amber-600' : 'text-gray-400'
                  }`}>
                    {label}
                  </p>
                  <p className={`text-lg font-bold ${
                    isPassing ? 'text-emerald-900' : (darkMode ? 'text-emerald-400' : 'text-emerald-800')
                  }`}>
                    {(jadwal as any)[key]}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Announcements */}
      <section>
        <SectionTitle title="Informasi & Kajian" icon={Bell} />
        <div className="flex overflow-x-auto gap-4 pb-2 -mx-2 px-2 scrollbar-hide">
          {ANNOUNCEMENTS.map((item) => (
            <div key={item.id} className={`min-w-[280px] p-4 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
              <span className="inline-block px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-lg mb-2 uppercase">
                {item.tag}
              </span>
              <h3 className={`font-bold mb-1 ${darkMode ? 'text-emerald-400' : 'text-emerald-900'}`}>{item.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-2">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Navigation Button */}
      <button 
        onClick={handleMaps}
        className={`w-full p-5 rounded-3xl border shadow-sm flex items-center gap-4 transition-all active:scale-[0.98] ${
          darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-emerald-50'
        }`}
      >
        <div className="p-3 bg-blue-100 rounded-2xl">
          <Navigation className="w-6 h-6 text-blue-600" />
        </div>
        <div className="text-left">
          <h3 className={`font-bold ${darkMode ? 'text-blue-400' : 'text-blue-900'}`}>Petunjuk Arah</h3>
          <p className="text-xs text-gray-400">Navigasi Google Maps ke Lokasi Masjid</p>
        </div>
        <ChevronRight className="w-5 h-5 ml-auto opacity-30" />
      </button>

      {/* Jurnal Ibadah Section */}
      <MutabaahSection darkMode={darkMode} />

      {/* Daily Hadith */}
      <section>
        <SectionTitle title="Hadits Hari Ini" icon={Heart} />
        <div className={`p-6 rounded-3xl border shadow-sm relative overflow-hidden ${darkMode ? 'bg-amber-900/10 border-amber-500/20' : 'bg-amber-50 border-amber-100'}`}>
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <BookOpen className="w-20 h-20 text-amber-900" />
          </div>
          <div className="relative z-10">
            <p className={`text-lg font-medium leading-relaxed italic mb-4 ${darkMode ? 'text-amber-200' : 'text-emerald-900'}`}>
              "{randomHadith.text}"
            </p>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
              — {randomHadith.source}
            </p>
          </div>
        </div>
      </section>

      {/* WhatsApp Support */}
      <section className="pt-2">
        <button 
          onClick={handleWA}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-5 rounded-3xl shadow-xl flex items-center justify-center gap-4 transition-all active:scale-[0.98]"
        >
          <div className="bg-white/20 p-2 rounded-full">
             <Plus className="w-6 h-6 rotate-45" />
          </div>
          <div className="text-left">
            <p className="font-bold">Hubungi Pengurus Masjid</p>
            <p className="text-xs text-emerald-100">Layanan Pertanyaan via WhatsApp</p>
          </div>
          <ChevronRight className="w-5 h-5 ml-auto opacity-50" />
        </button>
      </section>
    </div>
  );
};

// --- TAB: QURAN ---
const QuranTab = ({ darkMode }: { darkMode: boolean }) => {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSurah, setSelectedSurah] = useState<SurahDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [bookmark, setBookmark] = useState<Bookmark | null>(() => {
    const saved = localStorage.getItem('quran-bookmark');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    fetch('https://equran.id/api/v2/surat')
      .then(res => res.json())
      .then(data => {
        setSurahs(data.data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  const saveBookmark = (surah: Surah, ayatNomor?: number) => {
    const newBookmark = { surahNomor: surah.nomor, surahName: surah.namaLatin, ayatNomor };
    setBookmark(newBookmark);
    localStorage.setItem('quran-bookmark', JSON.stringify(newBookmark));
  };

  const filteredSurahs = useMemo(() => {
    return surahs.filter(s => 
      s.namaLatin.toLowerCase().includes(search.toLowerCase()) || 
      s.nomor.toString() === search
    );
  }, [surahs, search]);

  const openSurah = async (nomor: number) => {
    if (loadingDetail) return;
    setSelectedSurah(null); // Reset current surah to show loading state clearly
    setLoadingDetail(true);
    try {
      // Primary API: equran.id v2
      const res = await fetch(`https://equran.id/api/v2/surat/${nomor}`);
      if (!res.ok) throw new Error("Gagal mengambil data surah dari primary API");
      const data = await res.json();
      
      if (data && data.data && data.data.ayat) {
        setSelectedSurah(data.data);
      } else {
        // Fallback API: quran-api-id
        const res2 = await fetch(`https://quran-api-id.vercel.app/surah/${nomor}`);
        const data2 = await res2.json();
        if (data2 && data2.ayat) {
           // Mapping fallback data to our interface if needed
           setSelectedSurah({
             nomor: data2.number,
             nama: data2.name,
             namaLatin: data2.nameId,
             jumlahAyat: data2.numberOfVerses,
             tempatTurun: data2.revelationId,
             arti: data2.translationId,
             deskripsi: data2.description,
             audioFull: { "01": data2.audio },
             ayat: data2.ayat.map((a: any) => ({
               nomorAyat: a.number,
               teksArab: a.ar,
               teksLatin: a.tr,
               teksIndonesia: a.idn
             }))
           });
        } else {
          throw new Error("Data surah tidak valid di semua API");
        }
      }
    } catch (err) {
      console.error("Quran Fetch Error:", err);
      alert("Gagal memuat surah. Silakan periksa koneksi internet Anda.");
      setSelectedSurah(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="pb-6">
      <SectionTitle title="Al-Qur'anul Karim" icon={BookOpen} />
      
      {/* Bookmark Banner */}
      {bookmark && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`mb-6 p-4 rounded-2xl border ${darkMode ? 'bg-amber-900/20 border-amber-500/30' : 'bg-amber-50 border-amber-200'} flex items-center justify-between`}
        >
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-[10px] font-bold uppercase text-amber-600">Terakhir Dibaca</p>
              <p className={`font-bold ${darkMode ? 'text-amber-200' : 'text-emerald-900'}`}>
                {bookmark.surahName} {bookmark.ayatNomor ? `(Ayat ${bookmark.ayatNomor})` : ''}
              </p>
            </div>
          </div>
          <button 
            onClick={() => openSurah(bookmark.surahNomor)}
            className="bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all"
          >
            Lanjutkan
          </button>
        </motion.div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Cari Surah (contoh: Al-Fatihah)"
          className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Surah List */}
      <div className="space-y-3">
        {loading ? (
           <div className="flex justify-center p-10"><RefreshCcw className="animate-spin text-emerald-600" /></div>
        ) : filteredSurahs.map(surah => (
          <button 
            key={surah.nomor}
            onClick={() => openSurah(surah.nomor)}
            className={`w-full p-4 rounded-2xl border shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all ${
              darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
            }`}
          >
            <div className="flex items-center gap-4 text-left">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold border ${
                darkMode ? 'bg-slate-700 text-emerald-400 border-slate-600' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
              }`}>
                {surah.nomor}
              </div>
              <div>
                <h3 className={`font-bold ${darkMode ? 'text-emerald-300' : 'text-emerald-900'}`}>{surah.namaLatin}</h3>
                <p className="text-xs text-gray-400 uppercase tracking-wide">
                  {surah.tempatTurun} • {surah.jumlahAyat} AYAT
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-xl font-arabic mb-1 leading-none ${darkMode ? 'text-emerald-500' : 'text-emerald-700'}`}>{surah.nama}</p>
              <div className={`p-1 rounded-full group-hover:bg-emerald-100 transition-colors ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-700" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {(selectedSurah || loadingDetail) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex flex-col pt-12"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`flex-1 ${darkMode ? 'bg-slate-900' : 'bg-emerald-50'} rounded-t-[40px] overflow-hidden flex flex-col shadow-2xl`}
            >
                    <div className={`${darkMode ? 'bg-slate-800' : 'bg-emerald-800'} text-white p-6 flex flex-col gap-4 shrink-0 transition-colors`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center font-bold text-emerald-900 border-4 border-emerald-700 shadow-xl">
                            {selectedSurah?.nomor || '?'}
                          </div>
                          <div>
                            <h2 className="text-xl font-bold">{selectedSurah?.namaLatin || 'Memuat...'}</h2>
                            <p className="text-emerald-300 text-sm">{selectedSurah?.arti}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => selectedSurah && saveBookmark(selectedSurah)}
                            className={`p-2 rounded-full transition-colors ${bookmark?.surahNomor === selectedSurah?.nomor && !bookmark?.ayatNomor ? 'bg-amber-500 text-emerald-900' : 'bg-emerald-700/50 hover:bg-emerald-700'}`}
                            title="Tanda Terakhir Baca"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => setSelectedSurah(null)}
                            className="p-2 bg-emerald-700/50 rounded-full hover:bg-emerald-700 transition-colors"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                      
                      {selectedSurah && (
                        <div className={`${darkMode ? 'bg-slate-900/60' : 'bg-emerald-900/40'} rounded-2xl p-3 flex flex-col gap-2 border ${darkMode ? 'border-slate-700' : 'border-emerald-700/30'}`}>
                           <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 mb-1 px-1">Audio Murottal</p>
                           {selectedSurah.audioFull ? (
                             <audio 
                               controls 
                               className="w-full h-10 opacity-80"
                               src={selectedSurah.audioFull["01"] || selectedSurah.audioFull["05"]}
                             >
                               Your browser does not support the audio element.
                             </audio>
                           ) : (
                             <p className="text-xs text-emerald-400 px-1 italic opacity-50">Audio tidak tersedia</p>
                           )}
                        </div>
                      )}
                    </div>

              <div className={`flex-1 overflow-y-auto p-6 space-y-8 pb-12 ${darkMode ? 'bg-slate-900' : 'bg-emerald-50'}`}>
                 {loadingDetail ? (
                   <div className="flex flex-col items-center justify-center h-full gap-4 opacity-70">
                     <RefreshCcw className="w-10 h-10 animate-spin text-emerald-800" />
                     <p className={`font-medium ${darkMode ? 'text-emerald-400' : 'text-emerald-800'}`}>Membuka Surah...</p>
                   </div>
                 ) : selectedSurah ? (
                   <>
                    <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-emerald-100'} p-6 rounded-3xl border shadow-sm text-center mb-8`}>
                       <p className="text-emerald-700 font-medium mb-1">Bismillahir-rahmanir-rahim</p>
                       <p className={`text-3xl font-arabic leading-relaxed ${darkMode ? 'text-emerald-200' : 'text-emerald-900'}`}>بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم</p>
                    </div>

                    {selectedSurah && selectedSurah.ayat && selectedSurah.ayat.length > 0 ? (
                      selectedSurah.ayat.map(ayat => (
                        <div key={ayat.nomorAyat} className={`border-b pb-8 last:border-0 ${darkMode ? 'border-slate-800' : 'border-emerald-100'}`}>
                          <div className="flex items-center justify-between mb-4">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${darkMode ? 'bg-slate-800 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                              {ayat.nomorAyat}
                            </span>
                            <div className="flex gap-2">
                               <button 
                                  onClick={() => saveBookmark(selectedSurah, ayat.nomorAyat)}
                                  className={`p-2 rounded-xl transition-all ${bookmark?.surahNomor === selectedSurah.nomor && bookmark?.ayatNomor === ayat.nomorAyat ? 'bg-amber-500 text-white' : 'bg-slate-700/10 text-gray-400 hover:text-emerald-600'}`}
                               >
                                  <History className="w-4 h-4" />
                               </button>
                               <button className="p-2 text-emerald-300 hover:text-emerald-600 transition-colors"><Heart className="w-4 h-4" /></button>
                            </div>
                          </div>
                          <p className={`text-right text-3xl font-arabic leading-[1.8] mb-4 ${darkMode ? 'text-emerald-50' : 'text-emerald-900'}`} dir="rtl">
                            {ayat.teksArab}
                          </p>
                          <p className="text-emerald-700 italic text-sm mb-2">{ayat.teksLatin}</p>
                          <p className={`${darkMode ? 'text-slate-400' : 'text-gray-600'} text-[15px] leading-relaxed`}>{ayat.teksIndonesia}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 opacity-50">
                        <p>Tidak ada data ayat yang tersedia.</p>
                      </div>
                    )}
                   </>
                 ) : (
                    <div className="text-center py-20 opacity-50 flex flex-col items-center">
                      <X className="w-12 h-12 mb-4" />
                      <p>Gagal memuat data surah.</p>
                      <button 
                        onClick={() => setSelectedSurah(null)}
                        className="mt-4 px-6 py-2 bg-emerald-800 text-white rounded-full text-sm font-bold"
                      >
                        Kembali
                      </button>
                    </div>
                 )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- TAB: TASBIH ---
const TasbihTab = ({ darkMode }: { darkMode: boolean }) => {
  const [count, setCount] = useState(() => {
    const saved = localStorage.getItem('tasbih-count');
    return saved ? parseInt(saved) : 0;
  });
  const [target, setTarget] = useState(33);
  const [isDone, setIsDone] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (err) {
      console.error("Audio API error", err);
    }
  };

  useEffect(() => {
    localStorage.setItem('tasbih-count', count.toString());
    if (count > 0 && count % target === 0) {
      if (typeof window !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      setIsDone(true);
      setTimeout(() => setIsDone(false), 2000);
    }
  }, [count, target]);

  const handleIncrement = () => {
    setCount(prev => prev + 1);
    playBeep();
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const handleReset = () => {
    setCount(0);
    localStorage.setItem('tasbih-count', '0');
    // Sound/vibration feedback for reset
    playBeep();
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(200);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
      <SectionTitle title="Tasbih Digital" icon={CircleDot} />

      <div className={`flex gap-3 p-2 rounded-2xl shadow-sm border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
        {[33, 100, 1000].map(val => (
          <button 
            key={val}
            onClick={() => setTarget(val)}
            className={`px-6 py-2 rounded-xl font-bold transition-all ${
              target === val ? 'bg-emerald-700 text-white' : 'text-gray-400'
            }`}
          >
            {val}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
         <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Suara Klik</span>
         <button 
           onClick={() => setSoundEnabled(!soundEnabled)}
           className={`w-12 h-6 rounded-full relative transition-colors ${soundEnabled ? 'bg-emerald-600' : 'bg-gray-300'}`}
         >
           <motion.div 
             animate={{ x: soundEnabled ? 24 : 4 }}
             className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
           />
         </button>
      </div>

      <div className="relative p-8 group">
         {/* Spinning Beads */}
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">
            <motion.div 
               animate={{ rotate: count * (360 / 33) }}
               transition={{ type: "spring", stiffness: 120, damping: 20 }}
               className="w-80 h-80 relative flex items-center justify-center"
            >
               {Array.from({ length: 33 }).map((_, i) => (
                  <div 
                     key={i}
                     className={`absolute w-3.5 h-3.5 rounded-full shadow-sm transition-all duration-300 ${
                        i < (count % 33) 
                          ? 'bg-amber-400 scale-125 shadow-amber-400/50' 
                          : (darkMode ? 'bg-slate-700' : 'bg-emerald-200')
                     }`}
                     style={{
                        top: '50%',
                        left: '50%',
                        transform: `rotate(${i * (360 / 33)}deg) translateY(-145px) translateX(-50%)`,
                        transformOrigin: '0 0'
                     }}
                  />
               ))}
            </motion.div>
         </div>

         <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={handleIncrement}
            animate={isDone ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
            className={`w-64 h-64 rounded-full flex flex-col items-center justify-center shadow-2xl border-8 relative z-10 transition-colors cursor-pointer outline-none ${
              darkMode 
                ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 active:bg-slate-600' 
                : 'bg-white border-emerald-100 hover:bg-gray-50 active:bg-emerald-50'
            }`}
         >
            <span className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">Target: {target}</span>
            <motion.span 
              key={count}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-7xl font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-900'}`}
            >
              {count}
            </motion.span>
         </motion.button>
      </div>

      <div className="flex gap-6 w-full max-w-xs">
        <button 
          onClick={handleReset}
          className={`flex-1 py-4 px-6 border rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
            darkMode 
              ? 'bg-slate-800 border-red-900/30 text-red-400 hover:bg-red-500/10' 
              : 'bg-white border-red-100 text-red-600 hover:bg-red-50'
          }`}
        >
          <RefreshCcw className="w-5 h-5" />
          Reset
        </button>
        <button 
          onClick={() => setCount(prev => Math.max(0, prev - 1))}
          className={`flex-1 py-4 px-6 border rounded-2xl font-bold flex items-center justify-center gap-2 shadow-sm ${
            darkMode ? 'bg-slate-800 border-slate-700 text-emerald-400' : 'bg-white border-gray-200 text-emerald-700'
          }`}
        >
          <Minus className="w-5 h-5" />
          -1
        </button>
      </div>

      <p className="text-gray-400 text-sm italic text-center max-w-[250px]">
        Klik lingkaran besar untuk menambahkan hitungan.
      </p>
    </div>
  );
};

// --- TAB: DOA ---
const DoaTab = ({ darkMode }: { darkMode: boolean }) => {
  const [dzikirMode, setDzikirMode] = useState(false);
  const [dzikirIndex, setDzikirIndex] = useState(0);
  const [dzikirCount, setDzikirCount] = useState(0);

  const currentDzikir = DZIKIR_PAGI_PETANG[dzikirIndex];

  const handleNextDzikir = () => {
    if (dzikirIndex < DZIKIR_PAGI_PETANG.length - 1) {
      setDzikirIndex(prev => prev + 1);
      setDzikirCount(0);
    } else {
      setDzikirMode(false);
      setDzikirIndex(0);
      setDzikirCount(0);
      alert("Alhamdulillah, Anda telah menyelesaikan Dzikir Pagi & Petang!");
    }
  };

  const handleTap = () => {
    if (dzikirCount < currentDzikir.target) {
      setDzikirCount(prev => prev + 1);
      if (dzikirCount + 1 === currentDzikir.target) {
        if (navigator.vibrate) navigator.vibrate(100);
      } else {
        if (navigator.vibrate) navigator.vibrate(50);
      }
    }
  };

  if (dzikirMode) {
    return (
      <div className="flex flex-col min-h-[70vh] pb-10">
        <div className="flex items-center justify-between mb-8">
           <button 
             onClick={() => setDzikirMode(false)}
             className={`p-2 rounded-xl ${darkMode ? 'bg-slate-800 text-gray-400' : 'bg-white border text-gray-600'}`}
           >
             <ChevronLeft className="w-6 h-6" />
           </button>
           <div className="text-center">
             <h2 className="font-bold text-amber-600">Dzikir Pagi & Petang</h2>
             <p className="text-[10px] text-gray-400 font-bold uppercase">Bagian {dzikirIndex + 1} dari {DZIKIR_PAGI_PETANG.length}</p>
           </div>
           <div className="w-10 h-10" />
        </div>

        <motion.div 
          key={dzikirIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`flex-1 p-8 rounded-[3rem] border shadow-xl flex flex-col items-center justify-center text-center space-y-6 ${
            darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-emerald-50'
          }`}
        >
           <span className="px-4 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase tracking-widest">{currentDzikir.judul}</span>
           <p className={`text-4xl font-arabic leading-relaxed ${darkMode ? 'text-emerald-100' : 'text-emerald-900'}`} dir="rtl">{currentDzikir.arab}</p>
           <p className="text-emerald-700 italic text-sm">{currentDzikir.latin}</p>
           
           <div className="pt-8 flex flex-col items-center gap-4">
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={handleTap}
                disabled={dzikirCount >= currentDzikir.target}
                className={`w-32 h-32 rounded-full border-8 flex flex-col items-center justify-center shadow-lg transition-all ${
                  dzikirCount >= currentDzikir.target 
                    ? 'bg-emerald-500 border-emerald-400 text-white' 
                    : (darkMode ? 'bg-slate-900 border-slate-700 text-amber-400' : 'bg-emerald-50 border-emerald-100 text-emerald-800')
                }`}
              >
                 <span className="text-[10px] font-bold uppercase opacity-50">Ketuk</span>
                 <span className="text-4xl font-bold">{dzikirCount}</span>
                 <span className="text-xs">/ {currentDzikir.target}</span>
              </motion.button>

              {dzikirCount >= currentDzikir.target && (
                <motion.button 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={handleNextDzikir}
                  className="bg-amber-500 text-emerald-900 px-8 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:bg-amber-400 transition-colors"
                >
                  {dzikirIndex < DZIKIR_PAGI_PETANG.length - 1 ? 'Lanjutkan' : 'Selesai'}
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              )}
           </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      <SectionTitle title="Doa & Dzikir" icon={Heart} />

      <button 
        onClick={() => setDzikirMode(true)}
        className="w-full relative overflow-hidden bg-emerald-700 rounded-3xl p-8 text-white shadow-xl group transition-all active:scale-[0.98]"
      >
        <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-emerald-600 rounded-full blur-3xl opacity-50 group-hover:scale-110 transition-transform" />
        <div className="relative z-10 flex items-center justify-between">
           <div className="text-left">
              <div className="flex items-center gap-2 mb-2">
                 <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                 <span className="text-xs font-bold uppercase tracking-widest text-emerald-100">Fitur Premium</span>
              </div>
              <h3 className="text-2xl font-bold mb-1">Dzikir Pagi & Petang</h3>
              <p className="text-sm text-emerald-100">Mode fokus dengan counter otomatis</p>
           </div>
           <div className="bg-white/20 p-4 rounded-2xl">
              <ChevronRight className="w-8 h-8" />
           </div>
        </div>
      </button>

      <div className="pt-4">
        <SectionTitle title="Doa Harian Terpopuler" icon={Bell} />
        <div className="space-y-4">
          {DUA_COLLECTION.map(doa => (
            <div key={doa.id} className={`p-6 rounded-3xl border shadow-sm space-y-4 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
               <div className="flex items-center justify-between">
                  <h3 className="font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-lg text-sm">{doa.judul}</h3>
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold ${darkMode ? 'bg-slate-700 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>#{doa.id}</span>
               </div>
               <p className={`text-right text-2xl font-arabic leading-relaxed ${darkMode ? 'text-emerald-50' : 'text-emerald-900'}`} dir="rtl">{doa.arab}</p>
               <div className="space-y-2">
                  <p className="text-emerald-700 italic text-sm font-medium">{doa.latin}</p>
                  <p className={`text-sm leading-relaxed border-t pt-2 ${darkMode ? 'text-slate-400 border-slate-700' : 'text-gray-500 border-gray-50'}`}>{doa.terjemahan}</p>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- TAB: INFAQ ---
const InfaqTab = ({ darkMode }: { darkMode: boolean }) => {
  const [zoomQR, setZoomQR] = useState(false);
  const [harta, setHarta] = useState<string>('');
  
  const zakatInfo = useMemo(() => {
    const val = parseFloat(harta.replace(/\D/g, '')) || 0;
    const nishab = 100000000;
    if (val >= nishab) {
      return {
        amount: Math.floor(val * 0.025),
        isWajib: true
      };
    }
    return {
      amount: 0,
      isWajib: false
    };
  }, [harta]);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-6 pb-6">
      <SectionTitle title="Infaq & Sedekah" icon={Wallet} />
      
      <div className={`p-6 rounded-3xl border shadow-lg relative overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-emerald-100'}`}>
        <div className="absolute top-0 right-0 p-4 opacity-10">
           <QrCode className="w-20 h-20" />
        </div>
        
        <div className="relative z-10 text-center space-y-4">
          <h3 className={`text-xl font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-900'}`}>Ziswaf Masjid Halimatul Amin</h3>
          <p className="text-sm text-gray-500 leading-relaxed px-4">
            "Sedekah itu tidak akan mengurangi harta." (HR. Muslim). Mari bantu pembangunan dan operasional masjid kami.
          </p>

          <div className="space-y-3 py-4">
             <div className={`p-4 rounded-2xl text-left border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-emerald-50 border-emerald-100'}`}>
                <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Bank Syariah Indonesia (BSI)</p>
                <p className={`text-lg font-bold font-mono tracking-wider ${darkMode ? 'text-emerald-100' : 'text-emerald-900'}`}>7123 4567 89</p>
                <p className="text-xs text-gray-400">a.n DKM Masjid Halimatul Amin</p>
             </div>
          </div>

          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Atau Scan QRIS di Bawah</p>
          <div className="flex justify-center">
             <motion.div 
               whileTap={{ scale: 0.95 }}
               onClick={() => setZoomQR(true)}
               className="cursor-pointer p-4 bg-white rounded-3xl shadow-xl border border-gray-100 w-48 h-48 flex items-center justify-center"
             >
                <div className="text-center">
                   <QrCode className="w-24 h-24 text-emerald-800 mx-auto opacity-80" />
                   <p className="text-[10px] text-gray-400 mt-2">Ketuk untuk memperbesar</p>
                </div>
             </motion.div>
          </div>
        </div>
      </div>

      {/* Zakat Calculator */}
      <section className={`p-6 rounded-3xl border shadow-sm ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
        <div className="flex items-center gap-3 mb-4">
           <Calculator className="w-5 h-5 text-emerald-600" />
           <h3 className={`font-bold ${darkMode ? 'text-emerald-100' : 'text-emerald-900'}`}>Kalkulator Zakat Maal</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Total Harta Simpanan (1 Tahun)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
              <input 
                type="text" 
                inputMode="numeric"
                value={harta}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setHarta(val ? parseInt(val).toLocaleString('id-ID') : '');
                }}
                className={`w-full py-4 pl-12 pr-4 rounded-2xl border transition-all ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white focus:ring-emerald-500' : 'bg-gray-50 border-gray-100 focus:ring-emerald-500'
                }`}
                placeholder="0"
              />
            </div>
          </div>

          <div className={`p-4 rounded-2xl border-2 border-dashed ${
            zakatInfo.isWajib ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'
          }`}>
             {zakatInfo.isWajib ? (
               <div className="text-center">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Zakat yang Wajib Dikeluarkan (2.5%)</p>
                  <p className="text-2xl font-bold text-emerald-900">{formatIDR(zakatInfo.amount)}</p>
                  <p className="text-[10px] text-emerald-700 mt-1 italic">Harta Anda telah mencapai nishab zakat maal.</p>
               </div>
             ) : (
               <p className="text-xs text-gray-500 text-center italic">
                 {harta ? 'Harta belum mencapai nishab zakat maal, namun Anda tetap disarankan berinfaq.' : 'Masukkan jumlah harta untuk menghitung zakat.'}
               </p>
             )}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {zoomQR && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomQR(false)}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-8 backdrop-blur-md"
          >
             <motion.div 
               initial={{ scale: 0.5 }}
               animate={{ scale: 1 }}
               exit={{ scale: 0.5 }}
               className="bg-white p-8 rounded-[3rem] w-full max-w-sm aspect-square flex flex-col items-center justify-center"
             >
                <div className="mb-4 text-center">
                  <h3 className="font-bold text-emerald-900">QRIS Masjid Halimatul Amin</h3>
                  <p className="text-[10px] text-gray-400">NMID: ID1234567890</p>
                </div>
                <QrCode className="w-56 h-56 text-emerald-900" />
                <button 
                  className="mt-8 px-6 py-2 bg-emerald-800 text-white rounded-full text-sm font-bold"
                  onClick={() => setZoomQR(false)}
                >
                  Tutup
                </button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- MAIN APP ---
export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'quran' | 'tasbih' | 'doa' | 'infaq'>('home');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('dark-mode');
    return saved === 'true';
  });

  const [jadwal, setJadwal] = useState<JadwalData | null>(null);
  const [loadingJadwal, setLoadingJadwal] = useState(true);
  const [errorJadwal, setErrorJadwal] = useState<string | null>(null);
  const [isGeo, setIsGeo] = useState(false);
  const [adzanEnabled, setAdzanEnabled] = useState(() => {
    const saved = localStorage.getItem('adzan-enabled');
    return saved !== 'false';
  });

  const fetchPrayerTimes = async (lat?: number, lng?: number) => {
    setLoadingJadwal(true);
    setErrorJadwal(null);
    try {
      const date = new Date();
      const y = date.getFullYear();
      const m = date.getMonth() + 1;
      const d = date.getDate();
      
      let res;
      if (lat && lng) {
        res = await fetch(`https://api.aladhan.com/v1/timings/${Math.floor(Date.now()/1000)}?latitude=${lat}&longitude=${lng}&method=11`);
        const data = await res.json();
        if (data.code === 200) {
          const t = data.data.timings;
          setJadwal({
            tanggal: data.data.date.readable,
            imsak: t.Imsak,
            subuh: t.Fajr,
            terbit: t.Sunrise,
            dhuha: t.Dhuha || "06:15",
            dzuhur: t.Dhuhr,
            ashar: t.Asr,
            maghrib: t.Maghrib,
            isya: t.Isha,
            date: date.toISOString(),
            hijri: `${data.data.date.hijri.day} ${data.data.date.hijri.month.en} ${data.data.date.hijri.year}H`
          });
          setIsGeo(true);
          return;
        }
      }

      const res1 = await fetch(`https://api.myquran.com/v2/sholat/jadwal/1301/${y}/${m}/${d}`);
      const data1 = await res1.json();
      
      if (data1.status && data1.data && data1.data.jadwal) {
        setJadwal(data1.data.jadwal);
        setIsGeo(false);
      } else {
        const res2 = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=Jakarta&country=Indonesia&method=11`);
        const data2 = await res2.json();
        if (data2.code === 200) {
          const t = data2.data.timings;
          setJadwal({
            tanggal: date.toLocaleDateString(),
            imsak: t.Imsak,
            subuh: t.Fajr,
            terbit: t.Sunrise,
            dhuha: t.Dhuha || "06:15",
            dzuhur: t.Dhuhr,
            ashar: t.Asr,
            maghrib: t.Maghrib,
            isya: t.Isha,
            date: date.toISOString(),
            hijri: `${data2.data.date.hijri.day} ${data2.data.date.hijri.month.en} ${data2.data.date.hijri.year}H`
          });
        }
      }
    } catch (err) {
      console.error(err);
      setErrorJadwal("Gagal memuat jadwal.");
    } finally {
      setLoadingJadwal(false);
    }
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) return;
    setLoadingJadwal(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchPrayerTimes(pos.coords.latitude, pos.coords.longitude),
      () => fetchPrayerTimes(),
      { timeout: 10000 }
    );
  };

  const playAdzanSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); 
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      
      // Succession of beeps to signal adzan if real audio blocked
      [0, 0.4, 0.8].forEach(t => {
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime + t);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + t + 0.3);
      });

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1.2);
      
      // Also try real audio if browser allows
      const audio = new Audio("https://www.islamcan.com/audio/adhan/azan1.mp3");
      audio.play().catch(e => console.warn("Real adzan blocked by browser", e));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPrayerTimes();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!adzanEnabled || !jadwal) return;
      const now = new Date();
      const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':');
      
      const prayTimes = [jadwal.subuh, jadwal.dzuhur, jadwal.ashar, jadwal.maghrib, jadwal.isya];
      if (prayTimes.includes(timeStr)) {
        // Only trigger once per minute
        if (now.getSeconds() === 0) {
          playAdzanSound();
          if (navigator.vibrate) navigator.vibrate([500, 200, 500]);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [jadwal, adzanEnabled]);

  useEffect(() => {
    localStorage.setItem('dark-mode', darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('adzan-enabled', adzanEnabled.toString());
  }, [adzanEnabled]);

  return (
    <div className={`min-h-screen font-sans overflow-x-hidden pt-24 pb-24 transition-colors ${darkMode ? 'bg-slate-950 text-emerald-50' : 'bg-emerald-50 text-emerald-900'}`}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />
      
      <main className="container mx-auto px-6 max-w-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'home' && (
              <HomeTab 
                darkMode={darkMode} 
                jadwal={jadwal} 
                loading={loadingJadwal} 
                error={errorJadwal} 
                isGeo={isGeo}
                fetchPrayerTimes={fetchPrayerTimes}
                handleGeolocation={handleGeolocation}
                adzanEnabled={adzanEnabled}
                setAdzanEnabled={setAdzanEnabled}
              />
            )}
            {activeTab === 'quran' && <QuranTab darkMode={darkMode} />}
            {activeTab === 'tasbih' && <TasbihTab darkMode={darkMode} />}
            {activeTab === 'doa' && <DoaTab darkMode={darkMode} />}
            {activeTab === 'infaq' && <InfaqTab darkMode={darkMode} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className={`fixed bottom-6 left-6 right-6 z-50 rounded-[2rem] shadow-2xl border p-2 flex items-center justify-around backdrop-blur-md transition-colors ${
        darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-emerald-100/50'
      }`}>
        {[
          { id: 'home', label: 'Beranda', icon: Home },
          { id: 'quran', label: 'Al-Quran', icon: BookOpen },
          { id: 'doa', label: 'Doa', icon: Heart },
          { id: 'tasbih', label: 'Tasbih', icon: CircleDot },
          { id: 'infaq', label: 'Infaq', icon: Wallet },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center p-3 rounded-2xl transition-all relative ${
                isActive ? (darkMode ? 'text-emerald-400' : 'text-emerald-700') : 'text-gray-400 hover:text-emerald-600'
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="activeTabBg"
                  className={`absolute inset-0 rounded-2xl z-0 ${darkMode ? 'bg-slate-800' : 'bg-emerald-50'}`}
                />
              )}
              <tab.icon className={`w-5 h-5 relative z-10 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[9px] font-bold mt-1 uppercase tracking-wider relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Styles for Arabic Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Inter:wght@400;500;600;700&display=swap');
        
        .font-arabic {
          font-family: 'Amiri', serif;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
