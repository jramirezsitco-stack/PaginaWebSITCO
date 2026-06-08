'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ShieldCheck, BarChart3, 
  Clock, ArrowRight, Download, ArrowUp, DatabaseBackup, 
  Lectern, Send, Phone, Mail, MapPin, X
} from 'lucide-react';
import Image from 'next/image';

// --- IMPORTACIONES PARA SWIPER --- //
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade, Autoplay, Pagination } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';

import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';
import { PaymentReportForm } from '@/components/PaymentReportForm';

// 1. Interfaces para TypeScript
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

interface BlogCardProps {
  date: string;
  title: string;
  category: string;
}

interface Product {
  id: string;
  title: string;
  shortDesc: string;
  fullDesc: string;
  features: string[];
  category: string;
  badge?: string;
  icon: React.ReactNode;
  layout: 'featured' | 'wide' | 'compact' | 'medium' | 'compact-row';
}

const PRODUCTS: Product[] = [
  {
    id: 'smart-pharma',
    title: 'Smart Pharma',
    shortDesc: 'Nuestra herramienta líder de Inteligencia de Negocios. Analiza reportes, ventas y proyecciones con datos en tiempo real.',
    fullDesc: 'Smart Pharma es la solución insignia de SITCO para el sector farmacéutico. Integra análisis de ventas, proyecciones de demanda y reportes administrativos en una plataforma homologada por el SENIAT. Diseñada para farmacias corporativas, afiliadas e independientes que buscan decisiones basadas en datos.',
    features: [
      'Reportes de Análisis Avanzado',
      'Interfaz Intuitiva',
      'Optimización de Inventarios',
      'Homologación SENIAT v2.2.2',
      'Dashboards en tiempo real',
      'Gestión multi-sucursal',
    ],
    category: 'Inteligencia de Negocios',
    badge: 'Producto estrella',
    icon: <BarChart3 size={32} />,
    layout: 'featured',
  },
  {
    id: 'comparador-sitco',
    title: 'Comparador SITCO',
    shortDesc: 'Analiza precios y disponibilidad entre proveedores de forma automatizada.',
    fullDesc: 'El Comparador SITCO agiliza la toma de decisiones de compra al contrastar precios, existencias y condiciones comerciales entre múltiples proveedores. Reduce tiempos de cotización y maximiza el margen de tu farmacia con información actualizada.',
    features: [
      'Comparación automática de precios',
      'Alertas de disponibilidad',
      'Historial de cotizaciones',
      'Integración con inventario',
    ],
    category: 'Compras',
    icon: <ArrowRight size={24} />,
    layout: 'wide',
  },
  {
    id: 'sitco-pos',
    title: 'SITCO POS',
    shortDesc: 'Punto de Venta robusto.',
    fullDesc: 'SITCO POS es un sistema de punto de venta diseñado para el ritmo exigente de las farmacias. Procesa transacciones de forma rápida y segura, con control de caja, facturación y sincronización con el resto del ecosistema SITCO.',
    features: [
      'Facturación ágil',
      'Control de caja integrado',
      'Soporte para múltiples formas de pago',
      'Sincronización en la nube',
    ],
    category: 'Ventas',
    icon: <ShieldCheck size={32} />,
    layout: 'compact',
  },
  {
    id: 'gestor-respaldo',
    title: 'Gestor de Respaldo',
    shortDesc: 'Protección crítica con backups automáticos.',
    fullDesc: 'Protege la información crítica de tu farmacia con respaldos programados y automatizados. El Gestor de Respaldo SITCO garantiza la recuperación ante incidentes, cumpliendo estándares de seguridad para datos sensibles del sector salud.',
    features: [
      'Backups automáticos programados',
      'Almacenamiento seguro',
      'Restauración rápida',
      'Monitoreo de integridad',
    ],
    category: 'Seguridad',
    icon: <DatabaseBackup size={24} />,
    layout: 'medium',
  },
  {
    id: 'visor-precios',
    title: 'Visor de Precios',
    shortDesc: 'Transparencia inmediata para el cliente.',
    fullDesc: 'Muestra precios actualizados al público de forma clara y profesional. El Visor de Precios mejora la experiencia del cliente y refuerza la confianza en tu farmacia con información visible y siempre al día.',
    features: [
      'Actualización en tiempo real',
      'Pantalla dedicada para clientes',
      'Diseño personalizable',
      'Sincronización con inventario',
    ],
    category: 'Experiencia al cliente',
    icon: <Lectern size={28} />,
    layout: 'compact-row',
  },
];

interface DrogueriaPartner {
  id: string;
  name: string;
  logo: string;
  comingSoon?: boolean;
}

const COMPARADOR_DROGUERIAS: DrogueriaPartner[] = [
  { id: 'cobeca', name: 'Cobeca', logo: '/droguerias/cobeca.png' },
  { id: 'insuaminca', name: 'Insuaminca', logo: '/droguerias/insuaminca2.png' },
  { id: 'nena', name: 'Nena', logo: '/droguerias/nena.png' },
  { id: 'zakipharma', name: 'Zakipharma', logo: '/droguerias/zakipharma.png' },
  { id: 'del-oeste', name: 'Del Oeste', logo: '/droguerias/del-oeste.png' },
  { id: 'vitalclinic', name: 'VitalClinic', logo: '/droguerias/vitalclinic.png' },
  { id: 'intercontinental', name: 'Intercontinental', logo: '/droguerias/intercontinental.svg' },
  { id: 'farmaceutica24', name: 'Farmaceutica24', logo: '/droguerias/farmaceutica24.jpg' },
  { id: 'santo-remedio', name: 'Santo Remedio', logo: '/droguerias/santo-remedio.png' },
  { id: 'drovencentro', name: 'Drovencentro', logo: '/droguerias/drovencentro.png' },
  { id: 'mastranto', name: 'Mastranto', logo: '/droguerias/mastranto.webp', comingSoon: true },
  { id: 'drocerca', name: 'Drocerca', logo: '/droguerias/drocerca.png', comingSoon: true },
  { id: 'drosurven', name: 'Drosurven', logo: '/droguerias/drosurven.jpg', comingSoon: true },
  { id: 'drotaca', name: 'Drotaca', logo: '/droguerias/drotaca.png', comingSoon: true },
  { id: 'dromega', name: 'Dromega', logo: '/droguerias/dromega.png', comingSoon: true },
];

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: 'homologacion',
    question: '¿Qué significa que Smart Pharma 2.2.2 esté homologada?',
    answer: 'Significa que el software cumple estrictamente con todas las normativas fiscales y sanitarias exigidas por los entes reguladores en Venezuela (SENIAT y otros). Esto garantiza que tu farmacia opere dentro de la legalidad total, evitando sanciones y asegurando procesos de facturación transparentes.',
  },
  {
    id: 'integracion-cobeca',
    question: '¿Cómo es la integración con Droguería COBECA?',
    answer: 'Smart Pharma está diseñado para comunicarse directamente con el ecosistema de COBECA. Esto permite realizar pedidos automáticos basados en tus niveles de inventario, recibir facturas digitales de forma inmediata y sincronizar catálogos de productos y precios en tiempo real.',
  },
  {
    id: 'soporte',
    question: '¿Qué tipo de soporte técnico ofrecen?',
    answer: 'Contamos con un equipo de expertos dedicado exclusivamente al sector farmacéutico. Puedes contactarnos vía WhatsApp al +58 (424) 629-9954, por correo a atcsitco@cobeca.com en los horarios indicados en la sección de contacto, o solicitar asistencia remota y presencial según la necesidad.',
  },
  {
    id: 'migracion',
    question: '¿Es posible migrar los datos de mi sistema anterior?',
    answer: 'Sí, contamos con herramientas de migración de datos que facilitan la transición desde otros sistemas administrativos. Nuestro equipo técnico evalúa tu base de datos actual para asegurar que la información de inventario se traslade de forma segura y eficiente.',
  },
  {
    id: 'hardware-pos',
    question: '¿Qué requisitos de hardware necesito para instalar SITCO POS?',
    answer: 'Nuestros sistemas están optimizados para funcionar en equipos estándar de oficina. Recomendamos un procesador i5 6th o superior, al menos 12 GB de memoria RAM y sistema operativo Windows 10 o superior para garantizar una experiencia fluida y rápida en el punto de venta.',
  },
];

export default function Home() {
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    correo: '',
    asunto: '',
    descripcion: ''
  });

  const [showForm, setShowForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Datos del formulario SITCO:", formData);
    alert("¡Gracias! Tu mensaje ha sido enviado al equipo de SITCO.");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const posts = [
    { src: '/post1.jpg', alt: 'SITCO Post 1' },
    { src: '/post2.jpg', alt: 'SITCO Post 2' },
    { src: '/post3.jpg', alt: 'SITCO Post 3' },
    { src: '/post4.jpg', alt: 'SITCO Post 4' },
    { src: '/post5.jpg', alt: 'SITCO Post 5' },
    { src: '/post6.jpg', alt: 'SITCO Post 6' },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  
  const getItemsToShow = () => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? 2 : 4;
    }
    return 4;
  };

  const itemsToShow = getItemsToShow();
  const maxIndex = posts.length - itemsToShow;

  const nextSlide = () => setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  const prevSlide = () => setCurrentIndex((prev) => Math.max(prev - 1, 0));

  const heroSlides = [
    {
      title: 'Evolución Digital para tu Empresa Farmacéutica',
      desc: 'Soluciones tecnológicas eficientes, competitivas y comprometidas con el éxito de tu negocio.',
      image: '/hero-slide1.jpg',
    },
    {
      title: 'Smart Pharma 2.2.2',
      desc: 'Homologada por el SENIAT. El sistema administrativo Smart Pharma versión 2.2.2, desarrollado por SITCO, fue homologado oficialmente bajo esta providencia el 9 de mayo de 2025, recibiendo el documento oficial por el Seniat el 19 de mayo del 2025.',
      image: '/hero-slide2.jpg',
    },
    {
      title: 'Smart Pharma 3',
      desc: 'Gestión avanzada y reportes automatizados para farmacias modernas. Proximamente...',
      image: '/hero-slide3.jpg',
    },
  ];

  useEffect(() => {
    if (showForm && formRef.current) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showForm]);

  useEffect(() => {
    if (!showPaymentModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowPaymentModal(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showPaymentModal]);

  useEffect(() => {
    if (!selectedProduct) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedProduct(null);
    };
    window.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [selectedProduct]);

  return (
    <main className="min-h-screen font-sans overflow-x-hidden text-white
      bg-fixed bg-no-repeat
      bg-[size:15%,cover]
      bg-[position:left_center,center]
      bg-[image:url('/Sitco2.png'),linear-gradient(90deg,#48C6EF_0%,#1877F2_50%,#48C6EF_100%)]">        

      {/* --- MODAL REPORTE DE PAGO --- */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-modal="true"
            role="dialog"
          >
            <div
              className="absolute inset-0 bg-white/50 backdrop-blur-lg"
              onClick={() => setShowPaymentModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="relative z-[101] flex w-full max-w-xl max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-2xl border border-white/80 bg-white/75 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl"
            >
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/60 px-4 py-2.5 backdrop-blur-xl">
                <div className="min-w-0">
                  <h3 className="text-lg font-black text-slate-900 md:text-xl">Reportar Pago</h3>
                  <p className="text-[11px] text-slate-500 md:text-xs">
                    Completa los datos y adjunta el comprobante (PDF/JPG/PNG, máx. 5 MB).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="shrink-0 rounded-xl border border-slate-200/90 bg-white/80 p-2.5 text-slate-700 transition-all hover:bg-slate-100"
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="glass-scrollbar-light min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2.5 md:px-4 md:py-3">
                <PaymentReportForm />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODAL DETALLE DE PRODUCTO --- */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductDetailModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
          />
        )}
      </AnimatePresence>
      
      {/* --- NAVBAR --- */}
      <nav className="flex justify-between items-center p-4 max-w-7xl mx-auto my-4 rounded-full border border-white/20 bg-white/10 backdrop-blur-xl sticky top-4 z-50 shadow-2xl">
        <div className="flex items-center gap-3 pl-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Image src="/Sitco.png" alt="SITCO Logo" width={130} height={50} className="object-contain filter brightness-0 invert" style={{ height: 'auto', width: 'auto' }}/>
          </motion.div>          
        </div>
        <div className="hidden md:flex gap-2 text-sm font-semibold bg-black/20 p-1.5 rounded-full border border-white/10">
          <a href="#nosotros" className="px-5 py-2 rounded-full hover:bg-white/10 transition-colors">Prueba</a>
          <a href="#productos" className="px-5 py-2 rounded-full hover:bg-white/10 transition-colors">Productos</a>
          <a href="#blog" className="px-5 py-2 rounded-full hover:bg-white/10 transition-colors">Blog</a>
          <a href="#contacto" className="px-5 py-2 rounded-full hover:bg-white/20 transition-colors text-[#7bc143]">Contacto</a>
        </div>
        <div className="pr-2">
          <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-full border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.25)]">
            <button
              type="button"
              onClick={() => setShowPaymentModal(true)}
              className="hidden md:flex items-center gap-2 bg-white/10 text-white px-5 py-2.5 rounded-full text-sm font-black hover:bg-white hover:text-slate-950 transition-all border border-white/10"
            >
              Reportar pago
            </button>
            <a
              href="https://wa.me/584246299954"
              target="_blank"
              className="flex items-center gap-2 bg-white/10 text-white px-5 py-2.5 rounded-full text-sm font-black hover:bg-white hover:text-slate-950 transition-all border border-white/10"
            >
              Soporte Técnico
              <div className="w-2 h-2 rounded-full bg-[#7bc143] animate-pulse" />
            </a>
          </div>
        </div>        
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative w-full h-[75vh] overflow-hidden">
        <Swiper
          modules={[EffectFade, Autoplay, Pagination]}
          effect="fade"
          pagination={{ clickable: true }}
          autoplay={{ delay: 6000 }}
          className="w-full h-full"
        >
          {heroSlides.map((slide, index) => (
            <SwiperSlide key={index} className="relative w-full h-full">
              <Image src={slide.image} alt={slide.title} fill className="object-cover" priority={true} loading="eager" fetchPriority="high" quality={90} sizes="100vw" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-center max-w-7xl mx-auto px-6 md:px-12">
                <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-6xl font-black mb-4 leading-tight max-w-2xl tracking-tight">
                  {slide.title}
                </motion.h1>
                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-lg md:text-xl text-white/90 mb-8 max-w-3xl font-light">
                  {slide.desc}
                </motion.p>
                <motion.button className="bg-[#7bc143] text-white px-8 py-4 rounded-xl font-bold w-max hover:bg-white hover:text-slate-950 transition-all shadow-xl text-sm uppercase tracking-widest">
                  Descubrir
                </motion.button>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* --- CARDS DE PRODUCTOS RÁPIDOS --- */}
      <section className="max-w-7xl mx-auto px-6 py-10 pb-32">
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard icon={<BarChart3 className="text-[#7bc143]" />} title="Smart Pharma" desc="Inteligencia de negocios orientada al sector farmacéutico." />
          <FeatureCard icon={<ShieldCheck className="text-white" />} title="Soporte SITCO" desc="Atención especializada y personalizada para todas nuestras herramientas." />
          <FeatureCard icon={<Clock className="text-white" />} title="Llama Ya!" desc="Maneja todos los procesos de venta de productos y servicios." />
        </div>
      </section>

      {/* --- SECCIÓN NOSOTROS --- */}
      <section id="nosotros" className="max-w-7xl mx-auto px-6 py-24 relative overflow-hidden border-t border-white/10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <h2 className="text-[#7bc143] font-bold tracking-widest uppercase text-sm mb-4">¿Quiénes Somos?</h2>
            <h3 className="text-3xl md:text-4xl font-black mb-8 leading-tight text-white">
              Sistemas de Información Tecnológica <span className="text-[#7bc143]">COBECA, C.A</span>
            </h3>
            <p className="text-white/80 text-lg mb-6 leading-relaxed font-light">              
              SITCO es una unidad estratégica del Grupo Cobeca dedicada al desarrollo, implementación y soporte de soluciones tecnológicas para farmacias, con especial énfasis en el Sistema Smart Pharma. Su enfoque abarca desde la automatización administrativa hasta la gestión operativa y comercial de farmacias corporativas, afiliadas e independientes.
            </p>
            <div className="grid grid-cols-2 gap-6 mt-12">
              <div className="border-l-4 border-[#7bc143] pl-4">
                <h4 className="font-bold text-2xl text-white">Eficientes</h4>
                <p className="text-white/60 text-sm">Procesos optimizados.</p>
              </div>
              <div className="border-l-4 border-white pl-4">
                <h4 className="font-bold text-2xl text-white">Competitivos</h4>
                <p className="text-white/60 text-sm">Liderazgo nacional.</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-white/10 backdrop-blur-md rounded-[40px] p-2 border border-white/20 shadow-2xl"
          >
             <div className="bg-black/20 rounded-[38px] p-8 min-h-[300px] flex flex-col justify-center border border-white/5">
                <div className="flex gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-400/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400/50" />
                  <div className="w-3 h-3 rounded-full bg-green-400/50" />
                </div>
                <p className="font-mono text-sm text-[#7bc143] leading-relaxed">
                  {`// Misión SITCO`} <br />
                  <span className="text-white/90">Impulsar el éxito de nuestros aliados comerciales mediante herramientas de análisis de vanguardia...</span>
                </p>
                <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-3 gap-4 text-center">
                   <div><p className="text-xs text-white/40 uppercase font-bold">Productos</p><p className="font-bold text-xl text-white">+10</p></div>
                   <div><p className="text-xs text-white/40 uppercase font-bold">Regiones</p><p className="font-bold text-xl text-white">24</p></div>
                   <div><p className="text-xs text-white/40 uppercase font-bold">Años</p><p className="font-bold text-xl text-white">+10</p></div>
                </div>
             </div>
          </motion.div>
        </div>
      </section>

      {/* --- SECCIÓN NUESTROS PRODUCTOS --- */}
      <section id="productos" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/10">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-black mb-4">Nuestros Productos</h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            Soluciones integrales diseñadas específicamente para optimizar la cadena de valor farmacéutica.
          </p>
        </div>

        <div className="grid md:grid-cols-6 md:grid-rows-2 gap-4">
          {PRODUCTS.filter((p) => p.layout !== 'compact-row').map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => setSelectedProduct(product)}
            />
          ))}
        </div>

        <div className="grid md:grid-cols-4 gap-4 mt-4">
          {PRODUCTS.filter((p) => p.layout === 'compact-row').map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => setSelectedProduct(product)}
            />
          ))}
          <div className="md:col-span-3 bg-gradient-to-r from-[#7bc143] to-[#6ab03a] p-6 rounded-[2rem] flex items-center justify-between shadow-2xl">
            <span className="text-slate-950 font-black italic text-lg">"Comprometidos, Eficientes y Competitivos."</span>
            {/*<button className="text-xs font-bold uppercase tracking-widest bg-slate-950 text-white px-6 py-3 rounded-xl hover:scale-105 transition-transform">Ver Catálogo</button>*/}
          </div>
        </div>
      </section>              

      {/* --- SECCIÓN INSTAGRAM FEED --- */}
      <section id="instagram" className="max-w-7xl mx-auto px-6 py-24 border-t border-white/10 overflow-hidden">
        <div className="flex items-center justify-between mb-12">
          <h3 className="text-4xl font-black">Instagram @SITCO.LATAM</h3>
          <div className="flex gap-3">
            <button onClick={prevSlide} className="p-4 rounded-full bg-white/10 hover:bg-white hover:text-slate-950 transition-all shadow-lg"><ChevronLeft size={20} /></button>
            <button onClick={nextSlide} className="p-4 rounded-full bg-white/10 hover:bg-white hover:text-slate-950 transition-all shadow-lg"><ChevronRight size={20} /></button>
          </div>
        </div>
        <div className="relative w-full">
          <motion.div className="flex gap-4" animate={{ x: `-${currentIndex * (100 / itemsToShow)}%` }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            {posts.map((post, index) => (
              <motion.div key={index} className="w-1/2 md:w-1/4 flex-shrink-0 aspect-[4/5] rounded-[2rem] overflow-hidden border border-white/10 relative group shadow-xl">
                <Image src={post.src} alt={post.alt} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                  <span className="text-white font-bold text-sm border-2 border-white px-6 py-2 rounded-full">Ver Post</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* --- SECCIÓN BLOG --- */}
      <section id="blog" className="max-w-7xl mx-auto px-6 py-24 border-t border-white/10">
        <h3 className="text-4xl font-black mb-12 text-center">Blog & Noticias</h3>
        <div className="grid md:grid-cols-3 gap-8">
          <BlogCard date="05 Ene, 2026" title="Lanzamiento Smart Pharma v2.2.2" category="Software" />
          <BlogCard date="20 Dic, 2025" title="Optimización de Inventarios" category="Consejos" />
          <BlogCard date="12 Nov, 2025" title="Ciberseguridad Farmacéutica" category="Seguridad" />
        </div>
      </section>      

      {/* --- SECCIÓN SOPORTE TÉCNICO & CONTACTO --- */}
      <section id="contacto" className="max-w-7xl mx-auto px-6 py-24 border-t border-white/10">
        <div className="bg-white/10 backdrop-blur-xl rounded-[3rem] overflow-hidden relative group shadow-2xl border border-white/20">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 -skew-x-12 translate-x-32 group-hover:translate-x-20 transition-transform duration-1000" />
            
            <div className="relative z-10 p-10 md:p-20">
              <div className="grid md:grid-cols-2 gap-16 items-center">
                  <div>
                    <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">Centro de Soporte <span className="text-[#7bc143]">SITCO</span></h2>
                    <p className="text-white/70 text-lg mb-10 font-light">
                        ¿Necesitas ayuda técnica especializada? Nuestro equipo está listo para atenderte de forma personalizada sobre el uso de nuestras herramientas.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <a href="https://wa.me/584246299954" className="flex items-center gap-3 bg-white text-[#1877F2] px-8 py-5 rounded-2xl font-black shadow-2xl transition-all hover:scale-105 active:scale-95">
                          Contactarnos vía WhatsApp
                        </a>

                        <button onClick={() => setShowForm(!showForm)} className="bg-white/10 backdrop-blur-md border border-white/20 px-8 py-5 rounded-2xl hover:bg-white/20 transition-all flex items-center gap-3">
                          <span className="font-bold">Email de Atención</span>
                          <ChevronUp className={`w-5 h-5 transition-transform duration-500 ${!showForm ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 text-center font-bold">Remoto</div>
                    <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 text-center font-bold">24/7</div> 
                    <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 text-center font-bold flex flex-col items-center justify-center">
                        <span>Lunes a Viernes</span>
                        <span className="mb-4">8 am a 7 pm</span>
                        <span>Sábado, Domingo y Feriados</span>
                        <span>8 am a 4 pm</span>
                    </div>
                    <div className="bg-[#7bc143] p-8 rounded-3xl shadow-xl text-white text-center font-black h-32 flex items-center justify-center">atcsitco@cobeca.com</div>
                  </div>
              </div>

              <AnimatePresence>
                {showForm && (
                  <motion.div
                    ref={formRef}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="pt-20 mt-20 border-t border-white/10">
                      <div className="grid md:grid-cols-2 gap-16 items-start">
                        <div className="space-y-8">
                          <h3 className="text-4xl font-black text-white">Transforma tu <span className="text-[#7bc143]">Farmacia</span> hoy.</h3>
                          <div className="space-y-6">
                            <div className="flex items-center gap-5">
                              <div className="w-14 h-14 rounded-2xl bg-[#7bc143] flex items-center justify-center text-white shadow-lg shadow-[#7bc143]/40 hover:scale-110 transition-transform cursor-pointer">
                                <Phone size={24} />
                              </div>
                              <div><p className="text-xs text-white/40 uppercase font-bold tracking-widest">Llamadas</p><p className="text-xl font-medium">+58 (424) 629-9954</p></div>
                            </div>
                            <div className="flex items-center gap-5">
                              <div className="w-14 h-14 rounded-2xl bg-[#7bc143] flex items-center justify-center text-white shadow-lg shadow-[#7bc143]/40 hover:scale-110 transition-transform cursor-pointer">
                                <Mail size={24} />
                              </div>
                              <div><p className="text-xs text-white/40 uppercase font-bold tracking-widest">Email</p><p className="text-xl font-medium">atcsitco@cobeca.com</p></div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/10 shadow-inner">
                          <form onSubmit={handleContactSubmit} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black uppercase text-white/40 ml-2">Nombre</label>
                                <input type="text" name="nombre" required onChange={handleInputChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:bg-white/10 focus:border-[#7bc143] outline-none transition-all" placeholder="Nombre" />
                              </div>
                              <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black uppercase text-white/40 ml-2">Teléfono</label>
                                <input type="tel" name="telefono" required onChange={handleInputChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:bg-white/10 focus:border-[#7bc143] outline-none transition-all" placeholder="Teléfono" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black uppercase text-white/40 ml-2">Asunto</label>
                                <input type="text" name="asunto" required onChange={handleInputChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:bg-white/10 focus:border-[#7bc143] outline-none transition-all" placeholder="Ej: Smart Pharma v3" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black uppercase text-white/40 ml-2">Mensaje</label>
                                <textarea name="descripcion" rows={4} required onChange={handleInputChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:bg-white/10 focus:border-[#7bc143] outline-none resize-none transition-all" placeholder="¿En qué podemos ayudarte?" />
                            </div>
                            <button type="submit" className="w-full bg-[#7bc143] text-white font-black py-4 rounded-xl hover:bg-white hover:text-slate-950 transition-all flex items-center justify-center gap-3 group shadow-xl">
                              Enviar Solicitud <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
        </div>
      </section>

      {/* --- SECCIÓN FAQ --- */}
      <section id="faq" className="max-w-7xl mx-auto px-6 py-24 border-t border-white/10">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12 text-center">
            <span className="inline-block mb-4 text-[10px] font-black uppercase tracking-widest text-[#7bc143] border border-[#7bc143]/40 bg-[#7bc143]/10 px-4 py-1.5 rounded-full">
              Centro de Ayuda SITCO
            </span>
            <h2 className="text-4xl font-black mb-4">Preguntas Frecuentes</h2>
            <p className="text-white/60 max-w-2xl mx-auto font-light">
              Todo lo que necesitas saber para potenciar tu farmacia con nuestra tecnología.
            </p>
          </div>

          <FaqAccordion items={FAQS} />
        </div>
      </section>

      {/* --- BOTÓN FLOTANTE --- */}
      <motion.a href="#" className="fixed bottom-8 right-8 z-50 bg-white/10 backdrop-blur-xl p-5 rounded-full border border-white/20 shadow-2xl group hover:bg-[#7bc143] transition-all">
        <ArrowUp className="text-white transition-transform group-hover:-translate-y-1" size={24} />
      </motion.a>

      {/* --- BOTÓN FLOTANTE REPORTE DE PAGO --- */}
      <motion.button
        type="button"
        onClick={() => setShowPaymentModal(true)}
        className="fixed bottom-8 left-8 z-50 bg-[#7bc143] text-white px-6 py-4 rounded-full shadow-2xl font-black hover:scale-105 active:scale-95 transition-all border border-white/20"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
      >
        Reportar pago
      </motion.button>

      {/* --- FOOTER --- */}
      <footer className="bg-black/20 backdrop-blur-md border-t border-white/10 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <Image src="/Sitco.png" alt="SITCO Logo" width={120} height={40} className="filter brightness-0 invert opacity-50 mx-auto md:mx-0" />
            <div><h4 className="font-bold mb-4 uppercase text-xs tracking-widest text-white/40">Sede</h4><p className="text-sm font-medium">Calle 85 Edif. COBECA, Piso PB, Local 4-104. Sector Santa Lucía. Maracaibo - Zulia. Zona Postal 4001. Maracaibo, Venezuela.</p></div>
          </div>
          <div className="pt-8 border-t border-white/5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-[#7bc143]">
            © 2026 SISTEMAS DE INFORMACION TECNOLOGICA COBECA. TODOS LOS DERECHOS RESERVADOS.
          </div>
        </div>
      </footer>
    </main>
  );
}

// Componentes auxiliares actualizados con Glassmorphism
function FeatureCard({ icon, title, desc }: FeatureCardProps) {
  return (
    <motion.div whileHover={{ y: -10 }} className="bg-white/10 backdrop-blur-md p-8 rounded-[2rem] border border-white/10 h-full shadow-2xl transition-all hover:bg-white/20">
      <div className="mb-6 text-3xl filter drop-shadow-md">{icon}</div>
      <h3 className="text-xl font-black mb-3">{title}</h3>
      <p className="text-white/60 text-sm leading-relaxed font-light">{desc}</p>
    </motion.div>
  );
}

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-3">
      {items.map((faq) => {
        const isOpen = openId === faq.id;
        return (
          <div
            key={faq.id}
            className={`rounded-[1.25rem] border backdrop-blur-md overflow-hidden transition-all duration-300 ${
              isOpen
                ? 'bg-white/15 border-[#7bc143]/40 shadow-lg shadow-[#7bc143]/10'
                : 'bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/30'
            }`}
          >
            <button
              type="button"
              onClick={() => toggle(faq.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left md:px-6 md:py-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7bc143] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              <span className={`font-bold text-base md:text-lg leading-snug transition-colors ${isOpen ? 'text-[#7bc143]' : 'text-white'}`}>
                {faq.question}
              </span>
              <span className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-xl border transition-all ${
                isOpen
                  ? 'bg-[#7bc143] border-[#7bc143] text-white'
                  : 'bg-white/10 border-white/20 text-white/70'
              }`}>
                <ChevronDown
                  size={18}
                  className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
              </span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 md:px-6 md:pb-6 pt-0">
                    <div className="h-px bg-gradient-to-r from-[#7bc143]/50 via-white/20 to-transparent mb-4" />
                    <p className="text-white/75 text-sm md:text-base leading-relaxed font-light">
                      {faq.answer}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

function BlogCard({ date, title, category }: BlogCardProps) {
    return (
      <motion.div whileHover={{ y: -10 }} className="group cursor-pointer">
        <div className="aspect-video bg-white/5 backdrop-blur-sm rounded-[2rem] mb-6 overflow-hidden border border-white/10 shadow-inner group-hover:border-[#7bc143]/50 transition-all" />
        <p className="text-[10px] text-white/40 mb-2 font-black uppercase tracking-widest">{category} • {date}</p>
        <h4 className="text-xl font-bold group-hover:text-[#7bc143] transition-colors">{title}</h4>
      </motion.div>
    );
}

const LAYOUT_CLASSES: Record<Product['layout'], string> = {
  featured: 'md:col-span-3 md:row-span-2 bg-white/10 backdrop-blur-lg p-8 rounded-[2rem] border border-white/20 shadow-2xl',
  wide: 'md:col-span-3 bg-white/5 backdrop-blur-md p-8 rounded-[2rem] border border-white/10',
  compact: 'md:col-span-3 lg:col-span-1 bg-white/5 backdrop-blur-sm p-6 rounded-3xl border border-white/10',
  medium: 'md:col-span-3 lg:col-span-2 bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10',
  'compact-row': 'bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10',
};

function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const isFeatured = product.layout === 'featured';
  const isWide = product.layout === 'wide';
  const isCompact = product.layout === 'compact';
  const isMedium = product.layout === 'medium';
  const isCompactRow = product.layout === 'compact-row';

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: isFeatured ? 1.01 : 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`group text-left w-full flex flex-col justify-between hover:bg-white/20 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7bc143] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${LAYOUT_CLASSES[product.layout]}`}
      aria-label={`Ver detalles de ${product.title}`}
    >
      {isFeatured && (
        <>
          <div>
            <div className="bg-white text-[#1877F2] w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-xl">
              {product.icon}
            </div>
            <h3 className="text-3xl font-black mb-4">{product.title}</h3>
            <p className="text-white/70 text-lg leading-relaxed font-light">{product.shortDesc}</p>
          </div>
          <ul className="mt-8 space-y-3 text-sm font-medium">
            {product.features.slice(0, 3).map((f) => (
              <li key={f} className="flex items-center gap-2">
                <span className="text-[#7bc143]">✔</span> {f}
              </li>
            ))}
          </ul>
          <span className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-opacity">
            Ver detalles <ArrowRight size={14} />
          </span>
        </>
      )}

      {isWide && (
        <div className="flex gap-6 items-start">
          <div className="bg-white/10 w-12 h-12 rounded-xl flex items-center justify-center group-hover:bg-[#7bc143] transition-colors shrink-0">
            {product.icon}
          </div>
          <div className="min-w-0">
            <h3 className="text-xl font-bold mb-2">{product.title}</h3>
            <p className="text-white/60 text-sm">{product.shortDesc}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#7bc143] opacity-0 group-hover:opacity-100 transition-opacity">
              Ver detalles <ArrowRight size={12} />
            </span>
          </div>
        </div>
      )}

      {isCompact && (
        <div className="flex flex-col items-center text-center justify-center h-full">
          <div className="text-white mb-4 group-hover:scale-110 transition-transform">{product.icon}</div>
          <h3 className="font-bold text-sm uppercase tracking-tighter">{product.title}</h3>
          <p className="text-xs text-white/50 mt-2">{product.shortDesc}</p>
          <span className="mt-3 text-[10px] font-bold uppercase tracking-widest text-[#7bc143] opacity-0 group-hover:opacity-100 transition-opacity">
            Ver más
          </span>
        </div>
      )}

      {isMedium && (
        <div>
          <h3 className="font-bold mb-2 flex items-center gap-2">
            <span className="text-[#7bc143]">{product.icon}</span> {product.title}
          </h3>
          <p className="text-sm text-white/50">{product.shortDesc}</p>
          <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#7bc143] opacity-0 group-hover:opacity-100 transition-opacity">
            Ver detalles <ArrowRight size={12} />
          </span>
        </div>
      )}

      {isCompactRow && (
        <>
          <span className="text-[#7bc143] group-hover:scale-110 transition-transform inline-block">{product.icon}</span>
          <h3 className="font-bold text-sm mt-3">{product.title}</h3>
          <p className="text-xs text-white/50 mt-2">{product.shortDesc}</p>
          <span className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-opacity">
            Ver más
          </span>
        </>
      )}
    </motion.button>
  );
}

function getDrogueriaInitials(name: string) {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function DrogueriaLogo({ partner }: { partner: DrogueriaPartner }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={`w-full h-12 rounded-lg flex items-center justify-center mb-2 ${
          partner.comingSoon ? 'bg-white/10 text-white/40' : 'bg-white text-[#1877F2]'
        }`}
      >
        <span className="text-sm font-black">{getDrogueriaInitials(partner.name)}</span>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-14 mb-2 rounded-lg overflow-hidden flex items-center justify-center px-2 ${
        partner.comingSoon ? 'bg-white/10' : 'bg-white'
      }`}
    >
      <Image
        src={partner.logo}
        alt={`Logo ${partner.name}`}
        width={140}
        height={56}
        className={`object-contain max-h-11 w-auto max-w-full ${
          partner.comingSoon ? 'opacity-50 grayscale' : ''
        }`}
        onError={() => setHasError(true)}
      />
    </div>
  );
}

function DrogueriasCarousel({ partners }: { partners: DrogueriaPartner[] }) {
  const swiperRef = useRef<SwiperType | null>(null);
  const activeCount = partners.filter((p) => !p.comingSoon).length;
  const soonCount = partners.filter((p) => p.comingSoon).length;

  return (
    <div className="mb-8 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm p-4 md:p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest text-[#7bc143] mb-1">
            Droguerías compatibles
          </h4>
          <p className="text-white/60 text-xs md:text-sm font-light">
            {activeCount} integradas · {soonCount} próximamente
          </p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => swiperRef.current?.slidePrev()}
            className="p-2 rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-all"
            aria-label="Droguería anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => swiperRef.current?.slideNext()}
            className="p-2 rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-all"
            aria-label="Siguiente droguería"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <Swiper
        onSwiper={(swiper) => { swiperRef.current = swiper; }}
        modules={[Autoplay]}
        spaceBetween={12}
        slidesPerView={2.15}
        breakpoints={{
          480: { slidesPerView: 2.5 },
          640: { slidesPerView: 3 },
          768: { slidesPerView: 3.5 },
        }}
        autoplay={{ delay: 2800, disableOnInteraction: false, pauseOnMouseEnter: true }}
        loop
        className="!overflow-hidden !pb-1"
      >
        {partners.map((partner) => (
          <SwiperSlide key={partner.id} className="!h-auto">
            <div
              className={`relative flex flex-col items-center text-center rounded-xl border px-3 py-4 min-h-[7.5rem] transition-all ${
                partner.comingSoon
                  ? 'bg-white/5 border-white/15 border-dashed opacity-80'
                  : 'bg-white/15 border-white/25 hover:border-[#7bc143]/50 hover:bg-white/20'
              }`}
            >
              {partner.comingSoon && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-wider bg-white/20 text-white/90 px-2 py-0.5 rounded-full whitespace-nowrap border border-white/20">
                  Próximamente
                </span>
              )}
              <DrogueriaLogo partner={partner} />
              <p className={`text-xs font-bold leading-tight ${partner.comingSoon ? 'text-white/50' : 'text-white'}`}>
                {partner.name}
              </p>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

function ProductDetailModal({ product, onClose }: { product: Product; onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      aria-modal="true"
      role="dialog"
      aria-labelledby="product-modal-title"
    >
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="relative z-[101] flex w-full max-w-2xl max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-[#1877F2]/95 via-[#1a6fd4]/95 to-[#48C6EF]/90 shadow-2xl shadow-black/40 backdrop-blur-2xl"
      >
        <div className="absolute inset-0 bg-[url('/Sitco2.png')] bg-[length:30%] bg-left bg-no-repeat opacity-[0.04] pointer-events-none" />

        <div className="relative flex shrink-0 items-start justify-between gap-4 border-b border-white/15 px-6 py-5 md:px-8">
          <div className="flex items-start gap-4 min-w-0">
            <div className="shrink-0 bg-white text-[#1877F2] w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl">
              {product.icon}
            </div>
            <div className="min-w-0">
              {product.badge && (
                <span className="inline-block mb-1.5 text-[10px] font-black uppercase tracking-widest bg-[#7bc143] text-white px-3 py-1 rounded-full">
                  {product.badge}
                </span>
              )}
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/50 mb-1">{product.category}</p>
              <h3 id="product-modal-title" className="text-2xl md:text-3xl font-black text-white leading-tight">
                {product.title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl border border-white/20 bg-white/10 p-2.5 text-white transition-all hover:bg-white/20"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="glass-scrollbar-light relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6 md:px-8 md:py-8">
          <p className="text-white/90 text-base md:text-lg leading-relaxed font-light mb-8">
            {product.fullDesc}
          </p>

          {product.id === 'comparador-sitco' && (
            <DrogueriasCarousel partners={COMPARADOR_DROGUERIAS} />
          )}

          <h4 className="text-xs font-black uppercase tracking-widest text-[#7bc143] mb-4">
            Características principales
          </h4>
          <ul className="grid sm:grid-cols-2 gap-3 mb-8">
            {product.features.map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10 text-sm font-medium text-white/90"
              >
                <span className="shrink-0 w-6 h-6 rounded-full bg-[#7bc143]/20 flex items-center justify-center text-[#7bc143] text-xs">✔</span>
                {feature}
              </li>
            ))}
          </ul>

          <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-white/10">
            <a
              href="#contacto"
              onClick={onClose}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-[#7bc143] text-white font-black py-3.5 px-6 rounded-xl hover:bg-white hover:text-slate-950 transition-all shadow-lg text-sm uppercase tracking-wider"
            >
              Solicitar información <Send size={16} />
            </a>
            <a
              href="https://wa.me/584246299954"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white font-bold py-3.5 px-6 rounded-xl hover:bg-white/20 transition-all text-sm"
            >
              WhatsApp Soporte
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
