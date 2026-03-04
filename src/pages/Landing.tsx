import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Layout, Users, Share2, Palette, Zap, Shield, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import { useRef } from 'react';
import logo from '@/assets/logo.png';

const features = [
  { icon: Layout, title: 'لوحات مرنة', desc: 'أنشئ لوحات بأشكال عرض مختلفة - حائط، شبكة، أعمدة', color: 'from-violet-500 to-purple-600' },
  { icon: Users, title: 'تعاون حي', desc: 'اعمل مع فريقك في نفس الوقت على نفس اللوحة', color: 'from-blue-500 to-cyan-500' },
  { icon: Share2, title: 'مشاركة سهلة', desc: 'شارك لوحاتك برابط أو ادعو مستخدمين بالإيميل', color: 'from-emerald-500 to-teal-500' },
  { icon: Palette, title: 'تخصيص كامل', desc: 'خلفيات وألوان وأشكال مختلفة لكل لوحة وبوست', color: 'from-orange-500 to-rose-500' },
  { icon: Zap, title: 'محتوى متنوع', desc: 'نصوص، صور، روابط، ملفات - كل أنواع المحتوى', color: 'from-amber-500 to-yellow-500' },
  { icon: Shield, title: 'خصوصية وأمان', desc: 'تحكم كامل في من يشوف ومن يعدل لوحاتك', color: 'from-pink-500 to-rose-500' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }),
};

const stats = [
  { value: '∞', label: 'لوحات غير محدودة' },
  { value: '6+', label: 'أنواع محتوى' },
  { value: '100%', label: 'مجاني' },
];

export default function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="min-h-screen bg-background overflow-hidden" dir="rtl">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/">
            <img src={logo} alt="The Salma Padlet" className="h-14 object-contain" />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" asChild className="hidden sm:inline-flex"><Link to="/auth/login">تسجيل دخول</Link></Button>
            <Button asChild><Link to="/auth/signup">ابدأ مجاناً</Link></Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="pt-28 pb-20 px-4 relative min-h-[90vh] flex items-center">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ x: [0, 30, -20, 0], y: [0, -40, 20, 0], scale: [1, 1.1, 0.95, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute top-20 right-[10%] w-[400px] h-[400px] rounded-full bg-primary/15 blur-[120px]"
          />
          <motion.div
            animate={{ x: [0, -30, 20, 0], y: [0, 30, -30, 0], scale: [1, 0.9, 1.1, 1] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="absolute bottom-10 left-[15%] w-[500px] h-[500px] rounded-full bg-accent/15 blur-[140px]"
          />
          <motion.div
            animate={{ x: [0, 20, -10, 0], y: [0, -20, 40, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            className="absolute top-1/2 left-1/2 w-[300px] h-[300px] rounded-full bg-purple-500/10 blur-[100px]"
          />
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="container mx-auto text-center relative z-10 max-w-5xl">
          {/* Big Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8"
          >
            <img src={logo} alt="The Salma Padlet" className="h-40 sm:h-52 md:h-64 mx-auto object-contain drop-shadow-xl" />
          </motion.div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8"
          >
            <Sparkles className="h-4 w-4" />
            منصة لوحات تعاونية حديثة
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl sm:text-5xl md:text-7xl font-bold font-['Space_Grotesk'] leading-[1.1] mb-8"
          >
            نظّم أفكارك{' '}
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient-shift_3s_ease-in-out_infinite]">
              بأسلوب بصري
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg sm:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            أنشئ لوحات تفاعلية، شارك أفكارك مع فريقك، ونظّم محتواك بطريقة بصرية جذابة
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button size="lg" asChild className="text-lg px-10 h-14 rounded-2xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
              <Link to="/auth/signup">
                ابدأ مجاناً
                <ArrowRight className="mr-2 h-5 w-5 rotate-180" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-10 h-14 rounded-2xl">
              <Link to="/auth/login">تسجيل دخول</Link>
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="flex justify-center gap-8 sm:gap-16 mt-16"
          >
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 + i * 0.1, type: 'spring', stiffness: 200 }}
                className="text-center"
              >
                <div className="text-3xl sm:text-4xl font-bold font-['Space_Grotesk'] text-primary">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Preview mockup */}
      <section className="px-4 pb-20 -mt-10">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="container mx-auto max-w-5xl"
        >
          <div className="rounded-3xl border border-border bg-card/50 backdrop-blur-sm p-3 shadow-2xl shadow-primary/5">
            <div className="rounded-2xl bg-card overflow-hidden border border-border/50">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/30">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/60" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/60" />
                </div>
                <div className="flex-1 mx-8">
                  <div className="h-6 rounded-lg bg-muted/50 max-w-xs mx-auto" />
                </div>
              </div>
              <div className="p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {[
                  { h: 'h-28', bg: 'bg-violet-500/20' },
                  { h: 'h-36', bg: 'bg-blue-500/20' },
                  { h: 'h-24', bg: 'bg-emerald-500/20' },
                  { h: 'h-32', bg: 'bg-orange-500/20' },
                  { h: 'h-40', bg: 'bg-pink-500/20' },
                  { h: 'h-28', bg: 'bg-cyan-500/20' },
                  { h: 'h-36', bg: 'bg-amber-500/20' },
                  { h: 'h-24', bg: 'bg-rose-500/20' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    className={`${item.h} ${item.bg} rounded-xl border border-border/30`}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
        <div className="container mx-auto max-w-6xl relative">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-['Space_Grotesk'] mb-4">كل اللي تحتاجه في مكان واحد</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">أدوات قوية ومرنة لتنظيم أفكارك والتعاون مع فريقك</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                  <f.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2 font-['Space_Grotesk']">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-3xl sm:text-4xl font-bold text-center mb-16 font-['Space_Grotesk']">كيف يشتغل؟</motion.h2>
          <div className="space-y-8">
            {[
              { step: '1', title: 'أنشئ حسابك', desc: 'سجّل مجاناً في ثواني وابدأ فوراً' },
              { step: '2', title: 'أنشئ لوحة', desc: 'اختر شكل العرض واللون وخصص لوحتك' },
              { step: '3', title: 'أضف محتوى', desc: 'أضف نصوص، صور، روابط، وملفات' },
              { step: '4', title: 'شارك وتعاون', desc: 'ادعو فريقك وابدأوا العمل سوا' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex items-center gap-6"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-2xl font-bold font-['Space_Grotesk'] text-primary">{item.step}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold font-['Space_Grotesk'] mb-1">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative p-12 sm:p-16 rounded-[2rem] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-card to-accent/10 border border-border rounded-[2rem]" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <div className="relative z-10">
              <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 4, repeat: Infinity }} className="inline-block mb-6">
                <Star className="h-12 w-12 text-primary" />
              </motion.div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 font-['Space_Grotesk']">جاهز تبدأ؟</h2>
              <p className="text-muted-foreground mb-8 text-lg max-w-md mx-auto">أنشئ حسابك مجاناً وابدأ في بناء لوحاتك الإبداعية</p>
              <Button size="lg" asChild className="text-lg px-12 h-14 rounded-2xl shadow-lg shadow-primary/25">
                <Link to="/auth/signup">أنشئ حسابك الآن</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2026 The Salma Padlet. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  );
}
