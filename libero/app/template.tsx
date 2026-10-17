import { MotionScope } from '@/components/MotionScope';

/**
 * Her sayfa geçişinde yeniden oluşur: yumuşak sayfa girişi (yalnızca opacity + küçük yükselme, CSS)
 * ve görünürken-yükselme gözlemcisi. View Transitions API bilerek kullanılmıyor (statik dışa aktarımda
 * kararsız ve gereksiz).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-enter">
      <MotionScope>{children}</MotionScope>
    </div>
  );
}
