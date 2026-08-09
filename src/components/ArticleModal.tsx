import React from 'react';
import { BlogPost } from '../types';
import { X, Sparkles, Heart, HelpCircle, CheckCircle2, Image as ImageIcon, ShoppingBag, ArrowRight } from 'lucide-react';

interface ArticleModalProps {
  post: BlogPost | null;
  onClose: () => void;
  onNextArticle?: () => void;
  onOpenConverter?: () => void;
  onOpenShop?: () => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({
  post,
  onClose,
  onNextArticle,
  onOpenConverter,
  onOpenShop,
}) => {
  if (!post) return null;

  const renderFormattedText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-[#1D231E]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const authorInitials = post.author.name
    .split(' ')
    .map((n) => n[0])
    .join('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FAF6EE] rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 lg:p-10 shadow-2xl border border-[#E8E1D2] relative scrollbar-thin">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 rounded-full bg-[#E5EDE2] text-[#3D5239] flex items-center justify-center hover:bg-[#D5E2D1] transition-colors cursor-pointer z-10 shadow-xs"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Category Pill */}
        <span className="text-xs font-bold uppercase tracking-widest text-[#E06C38] bg-[#E06C38]/10 px-3.5 py-1 rounded-full inline-block mb-3">
          {post.category}
        </span>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1D231E] mb-4 leading-tight">
          {post.title}
        </h1>

        {/* Author & Meta */}
        <div className="flex items-center gap-3 text-xs text-[#6B7869] mb-6 pb-4 border-b border-[#E8E1D2]">
          <div className="w-9 h-9 rounded-full bg-[#E06C38] text-white flex items-center justify-center font-bold text-xs">
            {authorInitials}
          </div>
          <div>
            <span className="font-bold text-[#1D231E] text-sm block">{post.author.name}</span>
            <span>
              {post.date} • {post.readTime}
            </span>
          </div>
        </div>

        {/* Main Cover Image */}
        <div className="aspect-[16/9] max-h-[420px] rounded-2xl bg-[#E8E1D2]/50 border border-[#D5CDBC] flex flex-col items-center justify-center text-center text-[#7A8877] mb-8 overflow-hidden shadow-xs">
          {post.imageUrl ? (
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full h-full object-cover rounded-2xl"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="p-6">
              <ImageIcon className="w-10 h-10 mb-2 mx-auto text-[#93A28F]" />
              <span className="text-xs font-bold text-[#5A6659] block">Image Space Reserved</span>
              <span className="text-[11px] text-[#7A8877] block">Main article cover photo slot</span>
            </div>
          )}
        </div>

        {/* Excerpt Lead Paragraph */}
        <p className="text-base sm:text-lg font-medium text-[#1D231E] leading-relaxed mb-6 p-4 rounded-2xl bg-[#F0EBE0]/60 border-l-4 border-[#E06C38]">
          {post.excerpt}
        </p>

        {/* Render Rich Sections if available */}
        {post.contentSections && post.contentSections.length > 0 ? (
          <div className="space-y-4 text-[#3A4538]">
            {post.contentSections.map((section, idx) => {
              switch (section.type) {
                case 'paragraph':
                  return (
                    <p key={idx} className="text-sm sm:text-base leading-relaxed text-[#3A4538]">
                      {renderFormattedText(section.content || '')}
                    </p>
                  );

                case 'heading2':
                  return (
                    <h2
                      key={idx}
                      className="text-xl sm:text-2xl font-bold text-[#1D231E] mt-8 mb-4 pt-6 border-t border-[#E8E1D2] flex items-center gap-2"
                    >
                      <span>{section.title}</span>
                    </h2>
                  );

                case 'heading3':
                  return (
                    <h3
                      key={idx}
                      className="text-lg font-bold text-[#1D231E] mt-6 mb-2 flex items-center gap-2 text-[#E06C38]"
                    >
                      <Sparkles className="w-4 h-4 text-[#E06C38] shrink-0" />
                      <span>{section.title}</span>
                    </h3>
                  );

                case 'list':
                  return (
                    <ul key={idx} className="space-y-2.5 my-4 pl-1">
                      {section.items?.map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-start gap-2.5 text-sm text-[#3A4538]">
                          <CheckCircle2 className="w-4 h-4 text-[#E06C38] shrink-0 mt-0.5" />
                          <span>{renderFormattedText(item)}</span>
                        </li>
                      ))}
                    </ul>
                  );

                case 'image':
                  return (
                    <figure key={idx} className="my-6">
                      <div className="aspect-[16/9] max-h-[380px] rounded-2xl bg-[#E8E1D2]/50 border border-[#D5CDBC] flex flex-col items-center justify-center text-center text-[#7A8877] overflow-hidden shadow-xs">
                        {section.imageUrl ? (
                          <img
                            src={section.imageUrl}
                            alt={section.imageCaption || 'Article image slot'}
                            className="w-full h-full object-cover rounded-2xl"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="p-6">
                            <ImageIcon className="w-8 h-8 mb-2 mx-auto text-[#93A28F]" />
                            <span className="text-xs font-bold text-[#5A6659] block">Image Space Reserved</span>
                            {section.imageCaption && (
                              <span className="text-[11px] text-[#7A8877] mt-1 block">{section.imageCaption}</span>
                            )}
                          </div>
                        )}
                      </div>
                      {section.imageCaption && (
                        <figcaption className="text-center text-xs text-[#7A8877] mt-2.5 font-medium italic">
                          {section.imageCaption}
                        </figcaption>
                      )}
                    </figure>
                  );

                case 'callout':
                  return (
                    <div
                      key={idx}
                      className="my-6 p-5 rounded-2xl bg-[#E5EDE2] border border-[#C5D7C2] text-[#2C382B] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs"
                    >
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-[#1D231E] flex items-center gap-1.5">
                          <Heart className="w-4 h-4 text-[#E06C38] fill-[#E06C38]" />
                          {section.title}
                        </h4>
                        <p className="text-xs text-[#3A4538] leading-relaxed">{section.content}</p>
                      </div>
                      {section.ctaText && (
                        <button
                          onClick={() => {
                            onClose();
                            if (section.ctaAction === 'shop' && onOpenShop) {
                              onOpenShop();
                            } else if (onOpenConverter) {
                              onOpenConverter();
                            }
                          }}
                          className="px-4 py-2.5 bg-[#E06C38] hover:bg-[#c95b28] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{section.ctaText}</span>
                        </button>
                      )}
                    </div>
                  );

                case 'faq':
                  return (
                    <div key={idx} className="my-6 space-y-3">
                      {section.faqs?.map((faq, faqIdx) => (
                        <div
                          key={faqIdx}
                          className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E8E1D2] shadow-xs"
                        >
                          <h4 className="font-bold text-sm text-[#1D231E] mb-1.5 flex items-start gap-2">
                            <HelpCircle className="w-4 h-4 text-[#E06C38] shrink-0 mt-0.5" />
                            <span>{faq.question}</span>
                          </h4>
                          <p className="text-xs text-[#4A5749] leading-relaxed pl-6">{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  );

                case 'cta':
                  return (
                    <div
                      key={idx}
                      className="my-8 p-6 sm:p-8 rounded-3xl bg-[#1D231E] text-white text-center space-y-4 shadow-xl relative overflow-hidden"
                    >
                      <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#E06C38]/20 rounded-full blur-2xl pointer-events-none" />
                      <h3 className="text-xl sm:text-2xl font-bold text-white relative z-10">
                        {section.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#A2B0A0] max-w-md mx-auto relative z-10 leading-relaxed">
                        {section.content}
                      </p>
                      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
                        <button
                          onClick={() => {
                            onClose();
                            if (onOpenConverter) onOpenConverter();
                          }}
                          className="w-full sm:w-auto px-6 py-3 bg-[#E06C38] hover:bg-[#c95b28] text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>{section.ctaText || 'Open Photo Converter'}</span>
                        </button>
                        {onOpenShop && (
                          <button
                            onClick={() => {
                              onClose();
                              onOpenShop();
                            }}
                            className="w-full sm:w-auto px-5 py-3 bg-[#2A3429] hover:bg-[#384537] text-white text-xs font-bold rounded-full transition-all cursor-pointer border border-[#404F3F] flex items-center justify-center gap-2"
                          >
                            <ShoppingBag className="w-4 h-4 text-[#E06C38]" />
                            <span>Explore Kits & Threads</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );

                default:
                  return null;
              }
            })}
          </div>
        ) : (
          <div className="prose text-[#3A4538] text-sm leading-relaxed space-y-4">
            <p>Cross-stitching a photograph transforms precious memories into custom handmade keepsakes.</p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-10 pt-6 border-t border-[#E8E1D2] flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#E8E1D2] hover:bg-[#DCD4C3] text-[#1D231E] text-xs font-bold transition-colors cursor-pointer"
          >
            Close Article
          </button>

          {onNextArticle && (
            <button
              onClick={onNextArticle}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#1D231E] hover:bg-[#323D34] text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs group"
            >
              <span>Read Next Article</span>
              <ArrowRight className="w-4 h-4 text-[#E06C38] group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
