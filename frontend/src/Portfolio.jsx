import React, { useState, useEffect, useRef } from 'react';
import { Send, Github, Linkedin, Mail, Code, Sparkles, ArrowLeft, Menu, X } from 'lucide-react';
// react-markdown is optional; if not installed the app will still work with plain text
let ReactMarkdown;
let remarkGfm;
try {
  ReactMarkdown = require('react-markdown').default;
  remarkGfm = require('remark-gfm');
} catch (e) {
  ReactMarkdown = null;
  remarkGfm = null;
}

export default function Portfolio() {
  const [currentView, setCurrentView] = useState('home'); // 'home' or 'chat'
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [portfolioData, setPortfolioData] = useState(null);
  const messagesEndRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Load portfolio data
  useEffect(() => {
    fetch('http://localhost:8000/api/portfolio')
      .then(response => response.json())
      .then(data => setPortfolioData(data))
      .catch(error => console.error('Error loading portfolio data:', error));
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send a message. If `text` is provided it will be sent immediately;
  // otherwise the current inputValue is used.
  const handleSendMessage = async (text) => {
    const messageText = (typeof text === 'string' && text.trim()) ? text.trim() : inputValue.trim();
    if (!messageText || isLoading) return;

    const userMessage = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText })
      });

      const data = await response.json();
      const botMessage = { role: 'assistant', content: data.response };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startNewChat = () => {
    setMessages([]);
  };

  const suggestedQuestions = [
    "What are Adam's main skills?",
    "Tell me about Adam's projects",
    "What technologies does Adam work with?",
    "What is Adam's experience?"
  ];

  // Home Page View
  if (currentView === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
        {/* Animated background gradient */}
        <div 
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15), transparent 40%)`
          }}
        />
        
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>

        {/* Main content */}
        <div className="relative z-10">
          {/* Hero Section */}
          <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
              {/* Badge removed per request */}
              
              <h1 className="text-6xl md:text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-gradient">
                Adam El Amrani
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Engineering student specializing in AI and Big Data
              </p>
              
              <p className="text-lg text-slate-400 max-w-xl mx-auto">
                Building innovative solutions with modern technologies. 
                Ask my AI assistant anything about my work, skills, or projects.
              </p>

              {/* Prominent Fun Intro Card */}
              <div className="mt-8 mx-auto bg-gradient-to-br from-white/5 to-transparent backdrop-blur-lg border border-slate-700/40 rounded-3xl p-6 max-w-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/30 ring-1 ring-blue-500/10 animate-fade-in">
                <div className="flex items-start gap-5">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-pink-300">Quick Intro</h4>
                    <p className="text-sm text-slate-200 mt-2">Hi — I'm <span className="font-semibold text-white">Adam El Amrani</span>. I blend AI research with practical engineering and train Brazilian Jiu-Jitsu outside the lab.</p>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="px-3 py-2 bg-slate-800/40 border border-slate-700 rounded-lg text-sm text-slate-200">AI & Big Data @ UIR</div>
                      <div className="px-3 py-2 bg-slate-800/40 border border-slate-700 rounded-lg text-sm text-slate-200">LLM tools & pipelines</div>
                      <div className="px-3 py-2 bg-slate-800/40 border border-slate-700 rounded-lg text-sm text-slate-200">BJJ & Fitness</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-center pt-8">
                <a href="#projects" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-all transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50">
                  View Projects
                </a>
                <button 
                  onClick={() => setCurrentView('chat')}
                  className="px-8 py-3 border border-slate-600 hover:border-blue-500 rounded-lg font-medium transition-all transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 flex items-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Ask AI About Me
                </button>
              </div>

              {/* Social Links */}
              <div className="flex gap-6 justify-center pt-8">
                <a href={(portfolioData && portfolioData.contact && portfolioData.contact.github) || 'https://github.com/agrias-adm'} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all transform hover:scale-110 hover:shadow-lg">
                  <Github className="w-6 h-6" />
                </a>
                <a href={(portfolioData && portfolioData.contact && portfolioData.contact.linkedin) || 'https://www.linkedin.com/in/adam-el-amrani-1b5575372/'} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all transform hover:scale-110 hover:shadow-lg">
                  <Linkedin className="w-6 h-6" />
                </a>
                <a href={`mailto:${(portfolioData && portfolioData.contact && portfolioData.contact.email) || 'adam.elamrani04@gmail.com'}`} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all transform hover:scale-110 hover:shadow-lg">
                  <Mail className="w-6 h-6" />
                </a>
              </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 animate-bounce">
              <div className="w-6 h-10 border-2 border-slate-600 rounded-full flex items-start justify-center p-2">
                <div className="w-1 h-3 bg-blue-400 rounded-full animate-pulse" />
              </div>
            </div>
          </section>

          {/* Projects Section */}
          <section id="projects" className="min-h-screen py-20 px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-5xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                Featured Projects
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {portfolioData && portfolioData.projects.map((project, index) => (
                  <div 
                    key={index}
                    onClick={() => { setCurrentView('chat'); handleSendMessage(`Tell me about the project: ${project.name}`); }}
                    className="cursor-pointer group bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 hover:border-blue-500 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Code className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
                    <p className="text-slate-400 mb-4">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech, techIndex) => (
                        <span 
                          key={techIndex} 
                          className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Experience Section */}
          <section className="py-20 px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-5xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                Professional Experience
              </h2>
              
              <div className="space-y-12">
                {portfolioData && portfolioData.experience.map((exp, index) => (
                  <div 
                    key={index}
                    className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 hover:border-blue-500 transition-all duration-300"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-2xl font-semibold text-white mb-2">{exp.title}</h3>
                        <p className="text-lg text-blue-400 mb-1">{exp.company}</p>
                        <p className="text-slate-400">{exp.location} • {exp.date}</p>
                      </div>
                      <div className="flex gap-4">
                        {exp.report && (
                          <a 
                            href={`http://localhost:8000/api/reports/${exp.report.split('/').pop()}`}
                            download
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-all transform hover:scale-105 flex items-center gap-2 group"
                            onClick={(e) => {
                              e.preventDefault();
                              window.open(`http://localhost:8000/api/reports/${exp.report.split('/').pop()}`, '_blank');
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:translate-y-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 0 0 4.561 21h14.878a2 2 0 0 0 1.94-1.515L22 17"></path>
                            </svg>
                            Download Report
                          </a>
                        )}
                        <button 
                          onClick={() => { setCurrentView('chat'); handleSendMessage(`Tell me about your experience at ${exp.company}`); }}
                          className="px-4 py-2 border border-blue-500 hover:bg-blue-500/20 rounded-lg font-medium transition-all transform hover:scale-105 flex items-center gap-2"
                        >
                          <Sparkles className="w-5 h-5" />
                          Ask AI
                        </button>
                      </div>
                    </div>
                    
                    <ul className="space-y-3 text-slate-300">
                      {exp.tasks.map((task, taskIndex) => (
                        <li key={taskIndex} className="flex items-start gap-3">
                          <span className="text-blue-400 mt-1.5">•</span>
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <div className="mt-6 flex flex-wrap gap-2">
                      {exp.technologies.map((tech, techIndex) => (
                        <span 
                          key={techIndex}
                          className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Skills Section */}
          <section className="py-20 px-6 bg-slate-900/50">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-5xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                Skills & Technologies
              </h2>
              
              {portfolioData && Object.entries(portfolioData.skills).map(([category, skillsList], categoryIndex) => (
                <div key={categoryIndex} className="mb-12 last:mb-0">
                  <h3 className="text-2xl font-semibold mb-6 text-purple-400">
                    {category.replace('_', ' ').split(' ').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </h3>
                  <div className="grid md:grid-cols-4 gap-6">
                    {skillsList.map((skill, skillIndex) => (
                      <div 
                        key={skillIndex}
                        onClick={() => { setCurrentView('chat'); handleSendMessage(`What experience does Adam have with ${skill}?`); }}
                        className="cursor-pointer bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 text-center hover:border-purple-500 transition-all transform hover:scale-105"
                      >
                        <p className="font-semibold text-lg">{skill}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Animations and gradients are provided via Tailwind + src/index.css */}
      </div>
    );
  }

  // Chat View (Full Screen like ChatGPT)
  return (
    <div className="h-screen bg-slate-950 text-white flex overflow-hidden">
      {/* Sidebar removed - chat view is full width */}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('home')}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-semibold">Adam's AI Assistant</h2>
                <p className="text-xs text-slate-400">Powered by LLaMA 3.3 70B</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="max-w-3xl mx-auto px-6 text-center space-y-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl mx-auto flex items-center justify-center">
                  <Sparkles className="w-10 h-10" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                    Ask me anything about Adam
                  </h1>
                  <p className="text-slate-400 text-lg">
                    I'm an AI assistant trained on Adam's experience, skills, and projects. Feel free to ask me anything!
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-8">
                  {suggestedQuestions.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setCurrentView('chat'); handleSendMessage(question); }}
                      className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-blue-500 transition-all text-left group"
                    >
                      <p className="text-sm text-slate-300 group-hover:text-white transition-colors">
                        {question}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white px-5 py-3 rounded-2xl'
                        : 'text-slate-100'
                    } ${msg.role === 'assistant' ? 'prose prose-invert prose-lg !prose-headings:mb-2 !prose-p:mb-2 !prose-pre:bg-slate-900 !prose-pre:text-white !prose-pre:rounded-xl !prose-pre:p-4 !prose-code:bg-slate-800 !prose-code:text-blue-400 !prose-code:rounded !prose-code:px-1 !prose-code:py-0.5 !prose-code:font-mono !prose-code:text-sm !prose-code:before:content-[""] !prose-code:after:content-[""]' : ''}`}
                  >
                    {msg.role === 'assistant' && ReactMarkdown ? (
                      <ReactMarkdown remarkPlugins={remarkGfm} className="prose prose-invert prose-sm">
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-400 to-slate-500" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="flex gap-1 items-center">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-800 p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about Adam..."
                rows="1"
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 pr-14 focus:outline-none focus:border-blue-500 text-white placeholder-slate-500 resize-none"
                disabled={isLoading}
                style={{ minHeight: '56px', maxHeight: '200px' }}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="absolute right-3 bottom-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed p-2.5 rounded-xl transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 text-center mt-3">
              AI can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}