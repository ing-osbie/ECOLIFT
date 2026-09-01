import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, Mail, MessageSquare, Phone, Search } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';

const CATEGORIES = [
  { id: 'payouts',   icon: '💳', title: 'Account & Payouts',       sub: 'Earnings, direct deposit, tax info' },
  { id: 'vehicle',  icon: '🚛', title: 'Vehicle & Verification',   sub: 'Registration, insurance, inspections' },
  { id: 'tech',     icon: '🔧', title: 'Technical Issues',         sub: 'App glitches, GPS, connectivity' },
];

const ARTICLES = [
  'When do payouts process?',
  'Updating vehicle documentation',
  'Troubleshooting location services',
];

const COLLECTOR_FAQS = [
  { q: 'Why is my payout delayed?', a: 'Disbursements are usually instant. During network bottlenecks, payouts can take up to 2 hours. Contact support if it exceeds that.' },
  { q: 'What do I do in case of a customer dispute?', a: 'Take a clear photo of the waste area as proof. Our support team will use the uploaded photo to resolve the conflict.' },
  { q: 'How do I update my vehicle registration?', a: 'Go to Profile > Vehicle details. Changes require a quick document review before you can go online again.' },
  { q: 'How is my service area calculated?', a: 'Your neighborhood and radius are set in your profile. The app only matches you with requests within this range.' },
  { q: 'What happens if I miss too many jobs?', a: 'Declining jobs does not affect standing, but repeatedly missing accepted jobs can temporarily lock your account.' },
];

const CUSTOMER_FAQS = [
  { q: 'How do I pay for my waste pickup?', a: 'Ecolift supports Mobile Money, Credit/Debit Cards, and USSD. Configure your default payment under Profile > Payment Methods.' },
  { q: 'Can I cancel a scheduled pickup?', a: 'Yes. Cancel any time before the collector starts their journey. Toggle off recurring pickups in the Schedule tab.' },
  { q: 'How much does a waste pickup cost?', a: 'Standard household pickups cost GHS 25. Recyclables are GHS 15, and bulk/construction waste starts at GHS 75.' },
];

export default function Support() {
  const router = useRouter();
  const { userRole } = useApp();
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  const faqs = userRole === 'collector' ? COLLECTOR_FAQS : CUSTOMER_FAQS;
  const filtered = faqs.filter(f =>
    f.q.toLowerCase().includes(query.toLowerCase()) ||
    f.a.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Back header */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#003527" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help Center</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Hero */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroSub}>Find answers or reach out to our support team.</Text>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Search size={18} color="#707974" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for FAQs, topics..."
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {/* Categories */}
        <Text style={styles.sectionTitle}>Help Categories</Text>
        <View style={styles.categoryList}>
          {CATEGORIES.map(c => (
            <TouchableOpacity key={c.id} style={styles.categoryRow} activeOpacity={0.85}>
              <View style={styles.categoryIcon}>
                <Text style={{ fontSize: 22 }}>{c.icon}</Text>
              </View>
              <View style={styles.categoryMeta}>
                <Text style={styles.categoryTitle}>{c.title}</Text>
                <Text style={styles.categorySub}>{c.sub}</Text>
              </View>
              <ChevronRight size={18} color="#707974" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Top Articles */}
        <View style={styles.articlesHeader}>
          <Text style={styles.sectionTitle}>Top Articles</Text>
          <TouchableOpacity><Text style={styles.viewAll}>View All</Text></TouchableOpacity>
        </View>
        <View style={styles.articlesList}>
          {ARTICLES.map((a, i) => (
            <View key={i}>
              <TouchableOpacity style={styles.articleRow} activeOpacity={0.85}>
                <Text style={styles.articleIcon}>📄</Text>
                <Text style={styles.articleText}>{a}</Text>
              </TouchableOpacity>
              {i < ARTICLES.length - 1 && <View style={styles.articleDivider} />}
            </View>
          ))}
        </View>

        {/* FAQs */}
        {filtered.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Frequently Asked</Text>
            <View style={styles.faqList}>
              {filtered.map((f, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.faqCard}
                  onPress={() => setExpanded(expanded === i ? null : i)}
                  activeOpacity={0.85}
                >
                  <View style={styles.faqRow}>
                    <Text style={styles.faqQ}>{f.q}</Text>
                    <Text style={styles.faqChevron}>{expanded === i ? '▲' : '▼'}</Text>
                  </View>
                  {expanded === i && <Text style={styles.faqA}>{f.a}</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Still need help */}
        <Text style={styles.sectionTitle}>Still need help?</Text>
        <View style={styles.contactCard}>
          <TouchableOpacity style={styles.chatBtn} onPress={() => router.push('/chat' as any)} activeOpacity={0.9}>
            <MessageSquare size={20} color="#fff" />
            <Text style={styles.chatBtnText}>Start Live Chat</Text>
          </TouchableOpacity>
          <Text style={styles.waitText}>Avg. wait time: ~2 mins</Text>
          <View style={styles.contactGrid}>
            <TouchableOpacity style={styles.contactGridBtn} onPress={() => Linking.openURL('mailto:support@ecolift.app')} activeOpacity={0.85}>
              <Mail size={24} color="#006c49" />
              <Text style={styles.contactGridText}>Email Us</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactGridBtn} onPress={() => router.push('/call' as any)} activeOpacity={0.85}>
              <Phone size={24} color="#006c49" />
              <Text style={styles.contactGridText}>Call Helpline</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9f9ff' },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 60, gap: 16 },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  headerTitle: { fontSize: 17, fontFamily: 'Poppins-Bold', color: '#151c27' },

  heroSection: { gap: 4 },
  heroTitle: { fontSize: 26, fontFamily: 'Poppins-Bold', color: '#151c27' },
  heroSub: { fontSize: 14, fontFamily: 'Poppins-Medium', color: '#404944' },

  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f0f3ff', borderRadius: 12, paddingHorizontal: 14, height: 52 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Poppins-Medium', color: '#151c27' },

  sectionTitle: { fontSize: 16, fontFamily: 'Poppins-Bold', color: '#151c27' },

  categoryList: { gap: 10 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 14, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  categoryIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#e7eefe', alignItems: 'center', justifyContent: 'center' },
  categoryMeta: { flex: 1 },
  categoryTitle: { fontSize: 15, fontFamily: 'Poppins-SemiBold', color: '#151c27' },
  categorySub: { fontSize: 11, fontFamily: 'Poppins-Medium', color: '#404944', marginTop: 1 },

  articlesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewAll: { fontSize: 13, fontFamily: 'Poppins-SemiBold', color: '#003527' },
  articlesList: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  articleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  articleIcon: { fontSize: 18 },
  articleText: { fontSize: 14, fontFamily: 'Poppins-Medium', color: '#151c27', flex: 1 },
  articleDivider: { height: 1, backgroundColor: '#f0f3ff', marginHorizontal: 14 },

  faqList: { gap: 10 },
  faqCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  faqRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  faqQ: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#151c27', flex: 1, lineHeight: 20 },
  faqChevron: { fontSize: 10, color: '#003527', marginTop: 4 },
  faqA: { fontSize: 13, fontFamily: 'Poppins-Medium', color: '#404944', lineHeight: 20, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e7eefe' },

  contactCard: { backgroundColor: '#f0f3ff', borderRadius: 16, padding: 16, gap: 10 },
  chatBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#003527', borderRadius: 27, height: 52, shadowColor: '#003527', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 },
  chatBtnText: { fontSize: 15, fontFamily: 'Poppins-Bold', color: '#fff' },
  waitText: { fontSize: 12, fontFamily: 'Poppins-Medium', color: '#707974', textAlign: 'center' },
  contactGrid: { flexDirection: 'row', gap: 10 },
  contactGridBtn: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  contactGridText: { fontSize: 13, fontFamily: 'Poppins-SemiBold', color: '#151c27' },
});
