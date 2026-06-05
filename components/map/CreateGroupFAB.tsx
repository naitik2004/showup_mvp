import Link from 'next/link';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';


export default function CreateGroupFAB() {
  return (
    <div className="absolute bottom-6 right-6 z-[999]">
      <Link href="/groups/create">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          className="w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-xl shadow-primary/20 transition-colors hover:bg-primary/95"
          aria-label="Create Game Group"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </motion.button>
      </Link>
    </div>
  );
}
