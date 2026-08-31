import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';
import { GradientBackground } from '@/components/gradient-background';
import { GlassCard } from '@/components/glass-card';
import { Colors, getColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { ArrowLeft, Search, HelpCircle, ChevronDown, ChevronUp, MessageSquare, PhoneCall } from 'lucide-react-native';

interface FAQItem {
  question: string;
  answer: string;
}

const CUSTOMER_FAQS: FAQItem[] = [
  {
    question: 'How do I pay for my waste pickup?',
    answer: 'Ecolift supports payment through Moolre Mobile Money, major Credit/Debit Cards, and Moolre USSD code dialing. You can configure your default payment method under Profile > Payment Methods.',
  },
  {
    question: 'Can I cancel a scheduled pickup?',
    answer: 'Yes. You can cancel a single pickup at any time before the collector starts their journey. If you need to stop recurring pickups, toggle off the switch in the Schedule tab.',
  },
  {
    question: 'How much does a waste pickup cost?',
    answer: 'Standard household pickups cost GHS 25 per job. Rates for recyclable materials are lower (GHS 15), while construction and bulk waste starts at GHS 75 depending on the volume.',
  },
  {
    question: 'What types of waste do you collect?',
    answer: 'We collect Household Waste, Recyclables (plastic, paper, glass), Commercial Waste, and Bulk/Construction debris. Ensure you sort recyclables to take advantage of cheaper collection rates.',
  },
  {
    question: 'Who are the collectors?',
    answer: 'Ecolift partners with verified local collectors operating clean, branded tricycles or mini-trucks. All collectors undergo rigorous background and vehicle standard checks.',
  },
];

const COLLECTOR_FAQS: FAQItem[] = [
  {
    question: 'Why is my payout delayed?',
    answer: 'Moolre disbursements are usually instant. However, during telecom network bottlenecks, payouts can take up to 2 hours. If your payout does not reflect after 2 hours, contact support.',
  },
  {
    question: 'What do I do in case of a customer dispute?',
    answer: 'Always take a clear photo of the waste in the pickup area using the Ecolift app as proof of collection. If a customer raises a dispute, our support team will use the uploaded photo to resolve the conflict.',
  },
  {
    question: 'How do I update my vehicle registration?',
    answer: 'Go to Profile > Vehicle details to update your vehicle type and plate number. Note that vehicle changes require a quick document review by Ecolift staff before you can go online.',
  },
  {
    question: 'How is my service area calculated?',
    answer: 'Your neighborhood and service radius (e.g. 5km) are set in your profile. The app will only match you with customer requests within this range to optimize fuel and tricycle efficiency.',
  },
  {
    question: 'What happens if I miss or decline too many jobs?',
    answer: 'Declining jobs does not affect your account standing, but keeping your acceptance rate high increases matching priority. Repeatedly missing accepted jobs can temporarily lock your account.',
  },
];

export default function Support() {
  const router = useRouter();
  const { userRole, isDarkMode } = useApp();
  const C = getColors(isDarkMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const activeFAQS = userRole === 'collector' ? COLLECTOR_FAQS : CUSTOMER_FAQS;

  const toggleFAQ = (index: number) => {
    setExpandedIndex(prev => (prev === index ? null : index));
  };

  const filteredFAQS = activeFAQS.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Navigation Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
            <ArrowLeft size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: C.text }]}>Help Center</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Header Title */}
          <Text style={[styles.pageTitle, { color: C.text }]}>How can we help?</Text>
          <Text style={[styles.pageSubtitle, { color: C.greyText }]}>
            {userRole === 'collector' 
              ? 'Collector Support Knowledgebase' 
              : 'Search our knowledge base or contact us below'}
          </Text>

          {/* Search Bar */}
          <View style={[styles.searchContainer, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : '#FFFFFF', borderColor: C.border }]}>
            <Search size={20} color={C.greyText} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: C.text }]}
              placeholder="Search for help..."
              placeholderTextColor={isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(11, 61, 46, 0.3)'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* FAQ Accordion List */}
          <Text style={[styles.sectionTitle, { color: C.text }]}>Frequently Asked Questions</Text>
          
          <View style={styles.faqList}>
            {filteredFAQS.map((faq, index) => {
              const isExpanded = expandedIndex === index;
              return (
                <GlassCard key={index} style={styles.faqCard}>
                  <TouchableOpacity 
                    style={styles.faqHeader} 
                    onPress={() => toggleFAQ(index)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.faqQuestionRow}>
                      <HelpCircle size={18} color={C.primary} style={{ marginRight: 8, marginTop: 2 }} />
                      <Text style={[styles.faqQuestion, { color: C.text }]}>{faq.question}</Text>
                    </View>
                    {isExpanded ? (
                      <ChevronUp size={18} color={C.primary} />
                    ) : (
                      <ChevronDown size={18} color={C.primary} />
                    )}
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.faqAnswerContainer}>
                      <View style={[styles.faqDivider, { backgroundColor: C.border }]} />
                      <Text style={[styles.faqAnswer, { color: C.greyText }]}>{faq.answer}</Text>
                    </View>
                  )}
                </GlassCard>
              );
            })}

            {filteredFAQS.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: C.greyText }]}>No results matching your query.</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Sticky Support Footer */}
        <View style={[styles.footer, { backgroundColor: isDarkMode ? 'rgba(28, 28, 30, 0.95)' : 'rgba(255, 255, 255, 0.92)', borderColor: C.border }]}>
          <TouchableOpacity 
            style={[styles.chatBtn, { backgroundColor: C.primary, shadowColor: C.primary }]} 
            onPress={() => router.push('/chat')}
            activeOpacity={0.9}
          >
            <MessageSquare size={20} color={isDarkMode ? '#000000' : Colors.accent} style={{ marginRight: 8 }} />
            <Text style={[styles.chatBtnText, { color: isDarkMode ? '#000000' : '#FFFFFF' }]}>Chat with Support</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.callBtn, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF', borderColor: C.border }]} 
            onPress={() => router.push('/call')}
            activeOpacity={0.8}
          >
            <PhoneCall size={20} color={C.primary} />
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: Colors.textDark,
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 120, // Ensure room for sticky footer
  },
  pageTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: Colors.textDark,
  },
  pageSubtitle: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: Colors.greyText,
    marginTop: 2,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    paddingHorizontal: 16,
    height: 54,
    marginBottom: 24,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: Colors.textDark,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
    color: Colors.textDark,
    marginBottom: 12,
  },
  faqList: {
    gap: 12,
  },
  faqCard: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(11, 61, 46, 0.02)',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 0.95,
  },
  faqQuestion: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: Colors.textDark,
    lineHeight: 20,
  },
  faqAnswerContainer: {
    marginTop: 12,
  },
  faqDivider: {
    height: 1,
    backgroundColor: 'rgba(11, 61, 46, 0.04)',
    marginBottom: 10,
  },
  faqAnswer: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: Colors.greyText,
    lineHeight: 19,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: Colors.greyText,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderColor: Colors.borderLight,
  },
  chatBtn: {
    flex: 1,
    height: 54,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  chatBtnText: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
  },
  callBtn: {
    width: 54,
    height: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
});
