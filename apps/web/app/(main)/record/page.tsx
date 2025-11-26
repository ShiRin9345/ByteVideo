"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Square,
  Download,
  Play,
  Pause,
  ArrowLeft,
  Monitor,
  MonitorOff,
} from "lucide-react";

export default function RecordPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);
  const [hasAudio, setHasAudio] = useState(true);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const recordedVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(
    null,
  );

  // 格式化录制时间
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // 启动摄像头和麦克风
  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: hasAudio,
      });

      mediaStreamRef.current = stream;
      setIsStreamActive(true);
      setHasVideo(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => {
          console.error("Error playing video:", err);
        });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "无法访问摄像头或麦克风，请检查权限设置";
      setError(errorMessage);
      console.error("Error accessing media devices:", err);
      setHasVideo(false);
    }
  };

  // 停止摄像头和麦克风
  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsStreamActive(false);
    setHasVideo(false);
  };

  // 启动麦克风（独立于摄像头）
  const startMicrophone = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      micStreamRef.current = stream;
      console.log("麦克风已启动");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "无法访问麦克风，请检查权限设置";
      setError(errorMessage);
      console.error("Error accessing microphone:", err);
    }
  };

  // 停止麦克风
  const stopMicrophone = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
      console.log("麦克风已停止");
    }
  };

  // 启动屏幕录制
  const startScreenShare = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: hasAudio, // 系统音频
      });

      screenStreamRef.current = stream;
      setIsScreenSharing(true);

      // 检查屏幕流的音频轨道
      const screenAudioTracks = stream.getAudioTracks();
      if (hasAudio && screenAudioTracks.length === 0) {
        console.warn("屏幕录制未包含音频，请确保在浏览器提示时选择了包含音频");
      }

      // 如果没有摄像头流但有音频需求，启动麦克风
      if (!mediaStreamRef.current && hasAudio) {
        await startMicrophone();
      }

      // 合并屏幕流、摄像头流和麦克风流
      const combinedStream = new MediaStream();

      // 添加屏幕视频轨道
      stream.getVideoTracks().forEach((track) => {
        combinedStream.addTrack(track);
      });

      // 收集所有音频轨道
      const audioTracks: MediaStreamTrack[] = [];

      // 添加屏幕音频轨道（系统音频，如果存在且启用）
      screenAudioTracks.forEach((track) => {
        track.enabled = hasAudio;
        if (hasAudio) {
          audioTracks.push(track);
        }
      });

      // 添加摄像头音频轨道（如果存在且启用）
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = hasAudio;
          if (hasAudio) {
            audioTracks.push(track);
          }
        });
      }

      // 添加麦克风音频轨道（如果存在且启用）
      if (micStreamRef.current) {
        micStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = hasAudio;
          if (hasAudio) {
            audioTracks.push(track);
          }
        });
      }

      // 如果有多个音频轨道，使用 AudioContext 混合
      if (audioTracks.length > 1) {
        const mixedTrack = mixAudioTracks(audioTracks);
        if (mixedTrack) {
          combinedStream.addTrack(mixedTrack);
        }
      } else if (audioTracks.length === 1) {
        const audioTrack = audioTracks[0];
        if (audioTrack) {
          combinedStream.addTrack(audioTrack);
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = combinedStream;
        videoRef.current.play().catch((err) => {
          console.error("Error playing video:", err);
        });
      }

      // 监听屏幕共享结束事件
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.addEventListener("ended", () => {
          stopScreenShare();
        });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "无法访问屏幕，请检查权限设置";
      setError(errorMessage);
      console.error("Error accessing display media:", err);
      setIsScreenSharing(false);
    }
  };

  // 停止屏幕录制
  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    setIsScreenSharing(false);

    // 停止独立的麦克风流（如果存在）
    stopMicrophone();

    // 如果还有摄像头流，恢复显示摄像头
    if (mediaStreamRef.current && videoRef.current) {
      videoRef.current.srcObject = mediaStreamRef.current;
      videoRef.current.play().catch((err) => {
        console.error("Error playing video:", err);
      });
    } else if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // 使用 AudioContext 混合多个音频轨道
  const mixAudioTracks = (
    audioTracks: MediaStreamTrack[],
  ): MediaStreamTrack | null => {
    if (audioTracks.length === 0) {
      return null;
    }

    if (audioTracks.length === 1) {
      return audioTracks[0] ?? null;
    }

    try {
      // 创建或重用 AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const audioContext = audioContextRef.current;

      // 创建目标节点
      if (!audioDestinationRef.current) {
        audioDestinationRef.current =
          audioContext.createMediaStreamDestination();
      }
      const destination = audioDestinationRef.current;

      // 为每个音频轨道创建源节点并连接到目标
      audioTracks.forEach((track) => {
        const source = audioContext.createMediaStreamSource(
          new MediaStream([track]),
        );

        // 创建 GainNode 来控制音量（麦克风音量稍微提高，避免被系统音频覆盖）
        const gainNode = audioContext.createGain();
        // 如果是麦克风音频（通常 label 包含 "Microphone" 或 "Default"），稍微提高音量
        const isMic =
          track.label.toLowerCase().includes("microphone") ||
          track.label.toLowerCase().includes("default") ||
          track.label.toLowerCase().includes("mic");
        gainNode.gain.value = isMic ? 1.2 : 1.0; // 麦克风音量提高 20%

        source.connect(gainNode);
        gainNode.connect(destination);
      });

      // 返回混合后的音频轨道
      return destination.stream.getAudioTracks()[0] ?? null;
    } catch (err) {
      console.error("Error mixing audio tracks:", err);
      // 如果混合失败，返回第一个音频轨道
      return audioTracks[0] ?? null;
    }
  };

  // 获取浏览器支持的 MIME 类型
  const getSupportedMimeType = (): string => {
    const types = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm;codecs=h264,opus",
      "video/webm",
      "video/mp4",
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    // 如果都不支持，返回默认值
    return "video/webm";
  };

  // 开始录制
  const startRecording = () => {
    // 优先使用屏幕流，如果没有则使用摄像头流
    let stream: MediaStream | null = null;

    if (screenStreamRef.current) {
      // 如果有屏幕流，合并屏幕、摄像头和麦克风
      const combinedStream = new MediaStream();

      // 添加屏幕视频轨道
      screenStreamRef.current.getVideoTracks().forEach((track) => {
        combinedStream.addTrack(track);
      });

      // 收集所有音频轨道
      const audioTracks: MediaStreamTrack[] = [];

      // 添加屏幕音频轨道（系统音频，如果存在且启用）
      screenStreamRef.current.getAudioTracks().forEach((track) => {
        if (track.enabled) {
          audioTracks.push(track);
        }
      });

      // 添加摄像头音频轨道（如果存在且启用）
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getAudioTracks().forEach((track) => {
          if (track.enabled) {
            audioTracks.push(track);
          }
        });
      }

      // 添加麦克风音频轨道（如果存在且启用）
      if (micStreamRef.current) {
        micStreamRef.current.getAudioTracks().forEach((track) => {
          if (track.enabled) {
            audioTracks.push(track);
          }
        });
      }

      // 如果有多个音频轨道，使用 AudioContext 混合
      if (audioTracks.length > 1) {
        const mixedTrack = mixAudioTracks(audioTracks);
        if (mixedTrack) {
          combinedStream.addTrack(mixedTrack);
        }
      } else if (audioTracks.length === 1) {
        const audioTrack = audioTracks[0];
        if (audioTrack) {
          combinedStream.addTrack(audioTrack);
        }
      }

      stream = combinedStream;
    } else if (mediaStreamRef.current) {
      stream = mediaStreamRef.current;
    }

    if (!stream) {
      setError("请先启动摄像头或屏幕录制");
      return;
    }

    // 确保所有音频轨道都是启用的
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0 && hasAudio) {
      console.warn("警告：流中没有音频轨道，但音频已启用");
    }
    audioTracks.forEach((track) => {
      track.enabled = true;
    });

    try {
      chunksRef.current = [];
      const mimeType = getSupportedMimeType();

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // 等待一小段时间确保所有数据都已收集
        setTimeout(() => {
          // 确保所有数据都已收集
          if (chunksRef.current.length === 0) {
            setError("录制数据为空，请重新录制");
            return;
          }

          const mimeType = getSupportedMimeType();
          const blob = new Blob(chunksRef.current, { type: mimeType });

          // 验证 blob 大小
          if (blob.size === 0) {
            setError("录制的视频文件为空，请重新录制");
            return;
          }

          setRecordedBlob(blob);

          // 清理旧的 URL
          if (recordedUrl) {
            URL.revokeObjectURL(recordedUrl);
          }

          const url = URL.createObjectURL(blob);
          setRecordedUrl(url);

          // 等待 DOM 更新后再设置视频源
          setTimeout(() => {
            if (recordedVideoRef.current) {
              recordedVideoRef.current.src = url;
              recordedVideoRef.current.load(); // 重新加载视频
            }
          }, 100);
        }, 200);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // 每100ms收集一次数据
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);

      // 开始计时
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setError("录制失败，请检查浏览器支持");
      console.error("Error starting recording:", err);
    }
  };

  // 暂停/恢复录制
  const togglePause = () => {
    if (
      !mediaRecorderRef.current ||
      mediaRecorderRef.current.state === "inactive"
    ) {
      return;
    }

    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      // 恢复计时
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      // 暂停计时
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // 停止录制
  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      // 确保在停止前请求所有剩余数据
      if (mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.requestData();
      }
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
    setIsPaused(false);

    // 停止计时
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // 下载录制的视频
  const downloadVideo = () => {
    if (!recordedBlob) return;

    const mimeType = getSupportedMimeType();
    const extension = mimeType.includes("mp4") ? "mp4" : "webm";
    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recording-${Date.now()}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 切换视频
  const toggleVideo = async () => {
    const newHasVideo = !hasVideo;
    setHasVideo(newHasVideo);

    if (mediaStreamRef.current) {
      const videoTracks = mediaStreamRef.current.getVideoTracks();
      videoTracks.forEach((track) => track.stop());

      if (newHasVideo) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720 },
            audio: hasAudio,
          });

          const newVideoTrack = stream.getVideoTracks()[0];
          if (mediaStreamRef.current && newVideoTrack) {
            mediaStreamRef.current.addTrack(newVideoTrack);
            if (videoRef.current) {
              videoRef.current.srcObject = mediaStreamRef.current;
              videoRef.current.play().catch((err) => {
                console.error("Error playing video:", err);
              });
            }
          }
        } catch {
          setError("无法访问摄像头");
          setHasVideo(false);
        }
      }
    }
  };

  // 切换音频
  const toggleAudio = async () => {
    const newHasAudio = !hasAudio;
    setHasAudio(newHasAudio);

    // 处理摄像头流的音频轨道
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = newHasAudio;
      });
    }

    // 处理屏幕流的音频轨道
    if (screenStreamRef.current) {
      const audioTracks = screenStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = newHasAudio;
      });
    }

    // 处理麦克风流的音频轨道
    if (micStreamRef.current) {
      const audioTracks = micStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = newHasAudio;
      });
    } else if (newHasAudio && isScreenSharing && !mediaStreamRef.current) {
      // 如果屏幕录制时没有摄像头流，但需要音频，启动麦克风
      await startMicrophone();

      // 更新预览流
      if (screenStreamRef.current && videoRef.current) {
        const combinedStream = new MediaStream();
        screenStreamRef.current.getVideoTracks().forEach((track) => {
          combinedStream.addTrack(track);
        });

        // 收集所有音频轨道
        const audioTracks: MediaStreamTrack[] = [];
        screenStreamRef.current.getAudioTracks().forEach((track) => {
          if (newHasAudio) {
            audioTracks.push(track);
          }
        });
        if (micStreamRef.current) {
          const micStream = micStreamRef.current as MediaStream;
          micStream.getAudioTracks().forEach((track: MediaStreamTrack) => {
            if (newHasAudio) {
              audioTracks.push(track);
            }
          });
        }

        // 如果有多个音频轨道，使用 AudioContext 混合
        if (audioTracks.length > 1) {
          const mixedTrack = mixAudioTracks(audioTracks);
          if (mixedTrack) {
            combinedStream.addTrack(mixedTrack);
          }
        } else if (audioTracks.length === 1) {
          const audioTrack = audioTracks[0];
          if (audioTrack) {
            combinedStream.addTrack(audioTrack);
          }
        }

        videoRef.current.srcObject = combinedStream;
        videoRef.current.play().catch((err) => {
          console.error("Error playing video:", err);
        });
      }
    } else if (
      !newHasAudio &&
      micStreamRef.current &&
      isScreenSharing &&
      !mediaStreamRef.current
    ) {
      // 如果关闭音频且只有屏幕录制，停止麦克风
      stopMicrophone();

      // 更新预览流
      if (screenStreamRef.current && videoRef.current) {
        videoRef.current.srcObject = screenStreamRef.current;
        videoRef.current.play().catch((err) => {
          console.error("Error playing video:", err);
        });
      }
    }
  };

  // 清理资源
  useEffect(() => {
    return () => {
      stopCamera();
      stopScreenShare();
      stopMicrophone();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
      // 清理 AudioContext
      if (audioDestinationRef.current) {
        audioDestinationRef.current.disconnect();
        audioDestinationRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordedUrl]);

  return (
    <div className="bg-background min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-4">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">视频录制</h1>
          </div>
          <p className="text-muted-foreground mt-2 ml-9">
            使用 WebRTC 进行视频录制和预览
          </p>
        </div>

        {error && (
          <Card className="border-destructive mb-6">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* 实时预览 */}
          <Card>
            <CardHeader>
              <CardTitle>实时预览</CardTitle>
              <CardDescription>
                {isScreenSharing ? "屏幕录制画面" : "摄像头实时画面"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`h-full w-full object-contain ${
                    hasVideo || isScreenSharing ? "" : "hidden"
                  }`}
                  onLoadedMetadata={() => {
                    console.log("视频元数据已加载");
                  }}
                  onError={(e) => {
                    console.error("视频播放错误:", e);
                  }}
                />
                {!hasVideo && !isScreenSharing && (
                  <div className="text-muted-foreground absolute inset-0 flex h-full items-center justify-center">
                    <VideoOff className="h-16 w-16" />
                  </div>
                )}
                {isRecording && (
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-full bg-red-500 px-3 py-1 text-white">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
                    <span className="text-sm font-medium">
                      {formatTime(recordingTime)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={hasVideo ? stopCamera : startCamera}
                  disabled={isRecording || isScreenSharing}
                >
                  {hasVideo ? (
                    <>
                      <VideoOff className="h-4 w-4" />
                      关闭摄像头
                    </>
                  ) : (
                    <>
                      <Video className="h-4 w-4" />
                      启动摄像头
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                  disabled={isRecording}
                >
                  {isScreenSharing ? (
                    <>
                      <MonitorOff className="h-4 w-4" />
                      停止屏幕录制
                    </>
                  ) : (
                    <>
                      <Monitor className="h-4 w-4" />
                      开始屏幕录制
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={toggleVideo}
                  disabled={isRecording || !isStreamActive || isScreenSharing}
                >
                  {hasVideo ? (
                    <>
                      <VideoOff className="h-4 w-4" />
                      关闭视频
                    </>
                  ) : (
                    <>
                      <Video className="h-4 w-4" />
                      开启视频
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={toggleAudio}
                  disabled={!isStreamActive && !isScreenSharing}
                >
                  {hasAudio ? (
                    <>
                      <MicOff className="h-4 w-4" />
                      关闭音频
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" />
                      开启音频
                    </>
                  )}
                </Button>
              </div>

              <div className="flex gap-2">
                {!isRecording ? (
                  <Button
                    onClick={startRecording}
                    disabled={
                      (!hasVideo && !isScreenSharing) ||
                      (!isStreamActive && !isScreenSharing)
                    }
                    className="flex-1"
                  >
                    <Play className="h-4 w-4" />
                    开始录制
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={togglePause}
                      className="flex-1"
                    >
                      {isPaused ? (
                        <>
                          <Play className="h-4 w-4" />
                          继续
                        </>
                      ) : (
                        <>
                          <Pause className="h-4 w-4" />
                          暂停
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={stopRecording}
                      className="flex-1"
                    >
                      <Square className="h-4 w-4" />
                      停止录制
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 录制预览 */}
          <Card>
            <CardHeader>
              <CardTitle>录制预览</CardTitle>
              <CardDescription>查看已录制的视频</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
                {recordedUrl ? (
                  <video
                    ref={recordedVideoRef}
                    controls
                    className="h-full w-full object-cover"
                    onLoadedMetadata={() => {
                      console.log("视频元数据已加载");
                    }}
                    onError={(e) => {
                      console.error("视频加载错误:", e);
                      setError("视频无法播放，可能是格式不支持");
                    }}
                    onCanPlay={() => {
                      console.log("视频可以播放");
                    }}
                  />
                ) : (
                  <div className="text-muted-foreground flex h-full items-center justify-center">
                    <Video className="h-16 w-16" />
                    <p className="ml-4">暂无录制内容</p>
                  </div>
                )}
              </div>

              {recordedBlob && (
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">
                    文件大小: {(recordedBlob.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button
                    onClick={downloadVideo}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="h-4 w-4" />
                    下载视频
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
