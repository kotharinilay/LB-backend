######################################
# INSTALL OPENCV ON UBUNTU OR DEBIAN #
######################################

# -------------------------------------------------------------------- |
#                       SCRIPT OPTIONS                                 |
# ---------------------------------------------------------------------|
OPENCV_VERSION='4.3.0'        # Version to be installed
OPENCV_CONTRIB='YES'          # Install OpenCV's extra modules (YES/NO)
# -------------------------------------------------------------------- |

# 1. KEEP UBUNTU OR DEBIAN UP TO DATE

apt-get -y update
# sudo apt-get -y upgrade       # Uncomment to install new versions of packages currently installed
# sudo apt-get -y dist-upgrade  # Uncomment to handle changing dependencies with new vers. of pack.
# sudo apt-get -y autoremove    # Uncomment to remove packages that are now no longer needed


# 2. INSTALL THE DEPENDENCIES

# Generic tools
apt install -y build-essential cmake pkg-config unzip yasm git checkinstall wget

# Image I/O libs
apt install -y libjpeg-dev libpng-dev libtiff-dev

#Video/Audio Libs - FFMPEG, GSTREAMER, x264 and so on.

apt install -y libavcodec-dev libavformat-dev libswscale-dev libavresample-dev
apt install -y libgstreamer1.0-dev libgstreamer-plugins-base1.0-dev
apt install -y libxvidcore-dev x264 libx264-dev libfaac-dev libmp3lame-dev libtheora-dev 
apt install -y libfaac-dev libmp3lame-dev libvorbis-dev

#OpenCore - Adaptive Multi Rate Narrow Band (AMRNB) and Wide Band (AMRWB) speech codec
apt install -y libopencore-amrnb-dev libopencore-amrwb-dev

#Cameras programming interface libs
apt install -y libdc1394-22 libdc1394-22-dev libxine2-dev libv4l-dev v4l-utils
cd /usr/include/linux
ln -s -f ../libv4l1-videodev.h videodev.h
cd ~

# GTK lib for the graphical user functionalites coming from OpenCV highghui module
apt install -y libgtk-3-dev

# Python libraries for python3:
apt install -y python3-dev python3-pip
pip3 install -U pip numpy
apt install -y python3-testresources

# Parallelism library C++ for CPU
apt install -y libtbb-dev

# Optimization libraries for OpenCV
apt install -y libatlas-base-dev gfortran

# Optional libraries:
apt install -y libprotobuf-dev protobuf-compiler
apt install -y libgoogle-glog-dev libgflags-dev
apt install -y libgphoto2-dev libeigen3-dev libhdf5-dev doxygen

# 3. INSTALL THE LIBRARY
cd /usr/src

wget https://github.com/opencv/opencv/archive/${OPENCV_VERSION}.zip
unzip ${OPENCV_VERSION}.zip && rm ${OPENCV_VERSION}.zip
mv opencv-${OPENCV_VERSION} OpenCV

if [ $OPENCV_CONTRIB = 'YES' ]; then
  wget https://github.com/opencv/opencv_contrib/archive/${OPENCV_VERSION}.zip
  unzip ${OPENCV_VERSION}.zip && rm ${OPENCV_VERSION}.zip
  mv opencv_contrib-${OPENCV_VERSION} opencv_contrib
  mv opencv_contrib OpenCV
fi

cd OpenCV
mkdir build
cd build

if [ $OPENCV_CONTRIB = 'NO' ]; then
cmake \
  -DWITH_TBB=ON \
  -DWITH_CUDA=ON \
  -DWITH_CUDNN=ON \
  -DOPENCV_DNN_CUDA=ON \
  -DCUDA_ARCH_BIN=7.5 \
  -DBUILD_opencv_cudacodec=OFF \
  -DENABLE_FAST_MATH=1 \
  -DCUDA_FAST_MATH=1 \
  -DWITH_CUBLAS=1 \
  -DWITH_V4L=ON \
  -DWITH_QT=OFF \
  -DWITH_OPENGL=ON \
  -DWITH_GSTREAMER=ON \
  -DOPENCV_GENERATE_PKGCONFIG=ON \
  -DOPENCV_ENABLE_NONFREE=ON
fi

if [ $OPENCV_CONTRIB = 'YES' ]; then
cmake \
  -DWITH_TBB=ON \
  -DWITH_CUDA=ON \
  -DWITH_CUDNN=ON \
  -DOPENCV_DNN_CUDA=ON \
  -DCUDA_ARCH_BIN=7.5 \
  -DBUILD_opencv_cudacodec=OFF \
  -DENABLE_FAST_MATH=1 \
  -DCUDA_FAST_MATH=1 \
  -DWITH_CUBLAS=1 \
  -DWITH_V4L=ON \
  -DWITH_QT=OFF \
  -DWITH_OPENGL=ON \
  -DWITH_GSTREAMER=ON \
  -DOPENCV_GENERATE_PKGCONFIG=ON \
  -DOPENCV_ENABLE_NONFREE=ON \
  -DOPENCV_EXTRA_MODULES_PATH=../opencv_contrib/modules ..
fi

make -j4
make install
ldconfig
mv /usr/local/include/opencv4/opencv2 /usr/local/include/opencv2
rm -rf /usr/local/include/opencv4
#rm -rf /usr/src/OpenCV

# 4. EXECUTE SOME OPENCV EXAMPLES AND COMPILE A DEMONSTRATION

# To complete this step, please visit 'http://milq.github.io/install-opencv-ubuntu-debian'.

