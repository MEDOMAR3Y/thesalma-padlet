import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Layout, Users, Share2, Palette, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  { icon: Layout, title: 'لوحات مرنة', desc: 'أنشئ لوحات بأشكال عرض مختلفة - حائط، شبكة، أعمدة' },
  { icon: Users, title: 'تعاون حي', desc: 'اعمل مع فريقك في نفس الوقت على نفس اللوحة' },
  { icon: Share2, title: 'مشاركة سهلة', desc: 'شارك لوحاتك برابط أو ادعو مستخدمين بالإيميل' },
  { icon: Palette, title: 'تخصيص كامل', desc: 'خلفيات وألوان وأشكال مختلفة لكل لوحة وبوست' },
  { icon: Zap, title: 'محتوى متنوع', desc: 'نصوص، صور، روابط، ملفات - كل أنواع المحتوى' },
  { icon: Shield, title: 'خصوصية وأمان', desc: 'تحكم كامل في من يشوف ومن يعدل لوحاتك' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="text-2xl font-bold font-['Space_Grotesk'] bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            Boardly
          </Link>
          <div className="flex gap-3">
            <Button variant="ghost" asChild><Link to="/auth/login">تسجيل دخول</Link></Button>
            <Button asChild className="bg-primary hover:bg-primary/90"><Link to="/auth/signup">إنشاء حساب</Link></Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 right-1/4 w-72 h-72 rounded-full bg-primary/20 blur-[100px]" />
          <div className="absolute bottom-20 left-1/4 w-96 h-96 rounded-full bg-accent/20 blur-[120px]" />
        </div>
        <div className="container mx-auto text-center relative z-10 max-w-4xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-7xl font-bold font-['Space_Grotesk'] leading-tight mb-6"
          >
            نظّم أفكارك{' '}
            <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              بأسلوب بصري
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            أنشئ لوحات تفاعلية، أضف محتوى متنوع، وشارك أفكارك مع العالم. Boardly هو مساحتك الإبداعية.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex gap-4 justify-center"
          >
            <Button size="lg" asChild className="text-lg px-8 bg-primary hover:bg-primary/90">
              <Link to="/auth/signup">ابدأ مجاناً <ArrowRight className="mr-2 h-5 w-5 rotate-180" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8">
              <Link to="/auth/login">تسجيل دخول</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-center mb-16 font-['Space_Grotesk']"
          >
            كل اللي تحتاجه في مكان واحد
          </motion.h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-shadow duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 font-['Space_Grotesk']">{f.title}</h3>
                <p className="text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-12 rounded-3xl bg-gradient-to-br from-primary/10 via-card to-accent/10 border border-border"
          >
            <h2 className="text-3xl font-bold mb-4 font-['Space_Grotesk']">جاهز تبدأ؟</h2>
            <p className="text-muted-foreground mb-8 text-lg">أنشئ حسابك مجاناً وابدأ في بناء لوحاتك الإبداعية</p>
            <Button size="lg" asChild className="text-lg px-10 bg-primary hover:bg-primary/90">
              <Link to="/auth/signup">أنشئ حسابك الآن</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2026 Boardly. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  );
}
